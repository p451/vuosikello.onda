import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import { useRole } from '../contexts/RoleContext';
import { useToast } from '../contexts/ToastContext';
import TaskModal from './TaskModal';
import { useNavigate } from 'react-router-dom';
import { notifyEventCreated, notifyEventUpdated, notifyTaskCreated, notifyTaskCompleted, playNotificationSound } from '../lib/notificationUtils';

// Helper to format author name (prioritize profile fields)
const getAuthorName = (profile, userId) => {
  if (!profile) return userId;
  if (profile.name) return profile.name;
  if (profile.first_name || profile.last_name) {
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  }
  const metaName = profile.user_metadata?.name;
  return metaName || profile.email || userId;
};

const AikajanaKalenteri = ({ sidebarOpen, setSidebarOpen }) => {  
  const [viewMode, setViewMode] = useState('month');
  // Note: selectedLayer will be used for future layer filtering feature
  const [selectedLayer] = useState('all');
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'general',
    tenant_id: null,
    info: ''
  });

  // Add new state for detail view
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [eventTypes, setEventTypes] = useState([]);
  const eventTypeMap = Object.fromEntries(eventTypes.map(type => [type.name, type.color]));

  const { tenantId } = useTenant();
  const { can } = useRole();
  const [events, setEvents] = useState({});
  // Note: selectedEventType will be used for future event type filtering feature
  const [selectedEventType] = useState('all');

  const [showDayPanel, setShowDayPanel] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayPanelEvents, setDayPanelEvents] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const commentInputRef = useRef(null);

  const [visibleEventTypes, setVisibleEventTypes] = useState([]);

  // Lisää repeat state
  const [repeat, setRepeat] = useState({ enabled: false, frequency: 'none', count: 1, until: '' });

  const [dayPanelTasks, setDayPanelTasks] = useState([]);

  // State for add task modal (define only once at the top)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    category: '',
    event_id: null, // Added for event relation
  });

  const [calendarTasks, setCalendarTasks] = useState([]);

  // Helper for task priority color
  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { backgroundColor: '#f87171', color: '#fff' }; // Red
      case 'medium': return { backgroundColor: '#fbbf24', color: '#000' }; // Yellow
      case 'low': return { backgroundColor: '#34d399', color: '#000' }; // Green
      default: return { backgroundColor: '#e5e7eb', color: '#000' };
    }
  };

  // Helper: does a day have active tasks?
  function hasTasksForDay(date) {
    // Use local date string (YYYY-MM-DD) for both
    const ymd = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    return calendarTasks.some(task => task.deadline && task.deadline.slice(0, 10) === ymd);
  }
  // Helper: get tasks for a day
  function getTasksForDay(date) {
    const ymd = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    return calendarTasks.filter(task => task.deadline && task.deadline.slice(0, 10) === ymd && !task.completed);
  }

  // Handler for adding a task from the day panel (define only once)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...newTask, tenant_id: tenantId, deadline: newTask.deadline || (selectedDay ? getLocalDateString(selectedDay) : '') }])
        .select()
        .single();
      if (error) throw error;
      setShowAddTaskModal(false);
      setNewTask({ title: '', description: '', deadline: '', priority: 'medium', category: '', event_id: null });
      // Refresh tasks for the day panel
      if (selectedDay) {
        const { data: tasksForDay, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('deadline', getLocalDateString(selectedDay))
          .eq('completed', false);
        if (!fetchError) setDayPanelTasks(tasksForDay || []);
      }
    } catch (err) {
      console.error('Error adding task:', err);
      // Could add toast notification here in the future
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchEvents();
    };
    init();
    
    // Setup Realtime subscription for events
    if (!tenantId) return;
    
    console.log('Setting up events realtime subscription for tenant:', tenantId);
    
    const eventsChannel = supabase
      .channel(`public:events:tenant_id=eq.${tenantId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Events INSERT received:', payload);
          const newEvent = payload.new;
          // Lisää tapahtuma vastaavaan kategoriaan
          setEvents(prev => {
            const category = newEvent.type;
            const updated = { ...prev };
            if (!updated[category]) updated[category] = [];
            updated[category].push({
              id: newEvent.id,
              name: newEvent.name,
              startDate: newEvent.start_date,
              endDate: newEvent.end_date,
              type: newEvent.type,
              tenant_id: newEvent.tenant_id,
              info: newEvent.info
            });
            return updated;
          });
          // Lähetä toast ja ääni + OS-tason notifikaatio
          if (toast) {
            toast.success(`🎯 Uusi tapahtuma: "${newEvent.name}"`);
          }
          playNotificationSound();
          notifyEventCreated(newEvent.name);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Events UPDATE received:', payload);
          const updatedEvent = payload.new;
          // Päivitä tapahtuma
          setEvents(prev => {
            const category = updatedEvent.type;
            const updated = { ...prev };
            if (updated[category]) {
              updated[category] = updated[category].map(e =>
                e.id === updatedEvent.id ? {
                  id: updatedEvent.id,
                  name: updatedEvent.name,
                  startDate: updatedEvent.start_date,
                  endDate: updatedEvent.end_date,
                  type: updatedEvent.type,
                  tenant_id: updatedEvent.tenant_id,
                  info: updatedEvent.info
                } : e
              );
            }
            return updated;
          });
          if (toast) {
            toast.info(`📝 Tapahtuma päivitetty: "${updatedEvent.name}"`);
          }
          playNotificationSound();
          notifyEventUpdated(updatedEvent.name);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Events DELETE received:', payload);
          const deletedEvent = payload.old;
          const category = deletedEvent.type;
          // Poista tapahtuma
          setEvents(prev => ({
            ...prev,
            [category]: prev[category]?.filter(e => e.id !== deletedEvent.id) || []
          }));
        }
      )
      .subscribe((status) => {
        console.log('Events subscription status:', status);
      });

    return () => {
      console.log('Cleaning up events subscription');
      eventsChannel.unsubscribe();
    };
  }, [tenantId]);

  // Get tenant_id from user metadata on component mount
  useEffect(() => {
    const getTenantId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.tenant_id) {
        setNewEvent(prev => ({ ...prev, tenant_id: user.user_metadata.tenant_id }));
        setNewTask(prev => ({ ...prev, tenant_id: user.user_metadata.tenant_id }));
      }
    };
    getTenantId();
  }, []);

  useEffect(() => {
    const fetchEventTypes = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from('tenant_event_types')
        .select('*')
        .eq('tenant_id', tenantId);
      if (!error) setEventTypes(data);
    };
    fetchEventTypes();
  }, [tenantId]);

  useEffect(() => {
    setVisibleEventTypes(eventTypes.map(type => type.name));
  }, [eventTypes]);

  useEffect(() => {
    // Kuuntele sidebarin näkymätilan vaihtoa
    const handler = (e) => {
      if (e.detail === 'day' || e.detail === 'week' || e.detail === 'month') {
        setViewMode(e.detail);
      }
    };
    window.addEventListener('sidebar-set-viewmode', handler);

    // Kuuntele sidebarin print-nappien tapahtumia
    const printHandler = (e) => {
      if (e.detail === 'agenda') {
        // Käytetään täsmälleen samaa printAgenda-funktiota kuin kalenterin omassa napissa
        printAgenda();
      }
      if (e.detail === 'calendar') window.print();
    };
    window.addEventListener('sidebar-print', printHandler);

    return () => {
      window.removeEventListener('sidebar-set-viewmode', handler);
      window.removeEventListener('sidebar-print', printHandler);
    };
  }, []);

  // Synkronoidaan tärkeät tilat window-objektiin, jotta sidebarin print agenda toimii
  useEffect(() => {
    window.__vuosikello_viewMode = viewMode;
    window.__vuosikello_currentDate = currentDate;
    window.__vuosikello_events = events;
    window.__vuosikello_eventTypeMap = eventTypeMap;
  }, [viewMode, currentDate, events, eventTypeMap]);

  // Fetch all tasks for the current month (for indicators)
  useEffect(() => {
    if (!tenantId) return;
    const fetchCalendarTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('completed', false);
      if (!error && data) setCalendarTasks(data);
    };
    fetchCalendarTasks();
    
    // Setup Realtime subscription for calendar tasks
    console.log('Setting up calendar tasks realtime subscription for tenant:', tenantId);
    
    const tasksChannel = supabase
      .channel(`public:tasks:calendar:tenant_id=eq.${tenantId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Calendar tasks INSERT received:', payload);
          const newTask = payload.new;
          if (!newTask.completed) {
            setCalendarTasks(prev => [...prev, newTask]);
            // Lähetä toast ja ääni + OS-tason notifikaatio
            if (toast) {
              toast.success(`✓ Uusi tehtävä: "${newTask.title}"`);
            }
            playNotificationSound();
            notifyTaskCreated(newTask.title);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Calendar tasks UPDATE received:', payload);
          const updatedTask = payload.new;
          setCalendarTasks(prev => {
            if (updatedTask.completed) {
              // Lähetä toast ja ääni + OS-tason notifikaatio kun tehtävä valmistuu
              if (toast) {
                toast.success(`✅ Tehtävä valmistunut: "${updatedTask.title}"`);
              }
              playNotificationSound();
              notifyTaskCompleted(updatedTask.title);
              return prev.filter(t => t.id !== updatedTask.id);
            } else {
              return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          console.log('Calendar tasks DELETE received:', payload);
          const deletedTaskId = payload.old.id;
          setCalendarTasks(prev => prev.filter(t => t.id !== deletedTaskId));
        }
      )
      .subscribe((status) => {
        console.log('Calendar tasks subscription status:', status);
      });

    return () => {
      console.log('Cleaning up calendar tasks subscription');
      tasksChannel.unsubscribe();
    };
  }, [tenantId, currentDate]);

  const fetchEvents = async () => {
    if (!tenantId) {
      // No tenant ID available, skip fetching
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      if (!data) {
        // No events found in database
        return;
      }

      const grouped = {};
      data.forEach(event => {
        if (!grouped[event.type]) grouped[event.type] = [];
        grouped[event.type].push({
          id: event.id,
          name: event.name,
          startDate: event.start_date,
          endDate: event.end_date,
          type: event.type,
          tenant_id: event.tenant_id,
          info: event.info
        });
      });

      setEvents(grouped);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const deleteEvent = async (eventToDelete) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventToDelete.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      const category = eventToDelete.type;
      setEvents(prev => ({
        ...prev,
        [category]: prev[category].filter(event => event.id !== eventToDelete.id)
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Päivitä addEvent logiikka toistuville tapahtumille
  const addEvent = async () => {
    try {
      let eventsToInsert = [];
      if (repeat.enabled && repeat.frequency !== 'none') {
        // Luo toistuvat tapahtumat
        let start = new Date(newEvent.startDate);
        let end = new Date(newEvent.endDate);
        let until = repeat.until ? new Date(repeat.until) : null;
        let count = repeat.count || 1;
        let i = 0;
        while ((until ? start <= until : i < count)) {
          eventsToInsert.push({
            name: newEvent.name,
            start_date: start.toISOString().slice(0, 10),
            end_date: end.toISOString().slice(0, 10),
            type: newEvent.type,
            tenant_id: tenantId,
            info: newEvent.info
          });
          // Siirrä seuraavaan sykliin
          if (repeat.frequency === 'daily') {
            start.setDate(start.getDate() + 1);
            end.setDate(end.getDate() + 1);
          } else if (repeat.frequency === 'weekly') {
            start.setDate(start.getDate() + 7);
            end.setDate(start.getDate() + 7);
          } else if (repeat.frequency === 'monthly') {
            start.setMonth(start.getMonth() + 1);
            end.setMonth(start.getMonth() + 1);
          }
          i++;
        }
      } else {
        eventsToInsert.push({
          name: newEvent.name,
          start_date: newEvent.startDate,
          end_date: newEvent.endDate,
          type: newEvent.type,
          tenant_id: tenantId,
          info: newEvent.info
        });
      }      const { data, error } = await supabase
        .from('events')
        .insert(eventsToInsert)
        .select();
      if (error) throw error;
      if (data) {
        // Update the events state with the new data
        const newEvents = { ...events };
        data.forEach(event => {
          if (!newEvents[event.type]) newEvents[event.type] = [];
          newEvents[event.type].push({
            id: event.id,
            name: event.name,
            startDate: event.start_date,
            endDate: event.end_date,
            type: event.type,
            tenant_id: event.tenant_id,
            info: event.info
          });
        });
        setEvents(newEvents);
      }
      await fetchEvents();
      setShowAddModal(false);
      setNewEvent({ name: '', startDate: '', endDate: '', type: 'general', tenant_id: tenantId, info: '' });
      setRepeat({ enabled: false, frequency: 'none', count: 1, until: '' });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  // Päivitä eventin muokkaus (editEvent) info-kentälle
  const updateEvent = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: editEvent.name,
          start_date: editEvent.startDate,
          end_date: editEvent.endDate,
          type: editEvent.type,
          tenant_id: tenantId,
          info: editEvent.info
        })
        .eq('id', editEvent.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await fetchEvents();
      setShowEditModal(false);
      setEditEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };  // Fetch comments for an event
  const fetchComments = async (eventId) => {
    setCommentLoading(true);
    try {
      // Fetch comments without join
      const { data: commentsData, error: commentsError } = await supabase
        .from('event_comments')
        .select('id, content, created_at, parent_comment_id, user_id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (commentsError) throw commentsError;
      const commentsList = commentsData || [];
      // Fetch corresponding profiles
      const userIds = Array.from(new Set(commentsList.map(c => c.user_id)));
      let profiles = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, first_name, last_name, email, user_metadata')
          .in('id', userIds);
        if (profilesError) throw profilesError;
        profiles = profilesData;
      }
      // Attach profile to each comment
      setComments(
        commentsList.map(comment => ({
          ...comment,
          profile: profiles.find(p => p.id === comment.user_id) || null
        }))
      );
    } catch (err) {
      console.error('Error fetching comments:', err);
      // Could add toast notification here in the future
    } finally {
      setCommentLoading(false);
    }
  };

  // Add comment
  const addComment = async (eventId, content, parentId = null) => {
    setCommentLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('event_comments')
        .insert([{ event_id: eventId, user_id: user.id, tenant_id: tenantId, content, parent_comment_id: parentId }]);
      if (error) throw error;
      setNewComment('');
      setReplyTo(null);
      await fetchComments(eventId);
    } catch (err) {
      console.error('Error adding comment:', err);
      // Could add toast notification here in the future
    } finally {
      setCommentLoading(false);
    }
  };

  // Update handleEventClick to show detail view first
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
    fetchComments(event.id);
  };

  // Add handler for opening edit from detail view
  const handleEditClick = () => {
    setEditEvent(selectedEvent);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  // Update handleDayClick to include tasks
  const handleDayClick = async (day) => {
    setSelectedDay(day);
    setShowDayPanel(true);
  
    // Gather all events for this day
    const eventsForDay = Object.values(events).flat().filter(event => {
      const start = parseLocalDate(event.startDate);
      const end = parseLocalDate(event.endDate);
      return day >= start && day <= end;
    });
    setDayPanelEvents(eventsForDay);
  
    // Fetch tasks for the selected day
    try {
      const { data: tasksForDay, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('deadline', getLocalDateString(day));
  
      if (error) throw error;
      setDayPanelTasks(tasksForDay || []);
    } catch (err) {
      console.error('Error fetching tasks for the day:', err);
    }
  };

  const getDaysInMonth = (date) => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Adjust to start from Monday
    return { daysInMonth, firstDayWeekday };
  };

  const getWeekDays = (date) => {
    const week = [];
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);
    
    for (let i = 0; i < 7; i++) {
      week.push(new Date(start.setDate(start.getDate() + (i === 0 ? 0 : 1))));
    }
    return week;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fi-FI', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  // Removed unused navigate function as its functionality is handled elsewhere

  // Helper for event type color (only backgroundColor is allowed inline)
  const getEventTypeColor = (type) => {
    if (eventTypeMap[type]) return { backgroundColor: eventTypeMap[type] };
    return { backgroundColor: '#e2e8f0' };
  };

  // Helper to parse local date string (YYYY-MM-DD)
  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to get local date string (YYYY-MM-DD)
  const getLocalDateString = (date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  // Helper to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const getEventTypeName = (type) => {
    return type;
  };

  const getViewDateRange = () => {
    switch (viewMode) {
      case 'day':
        return {
          start: new Date(currentDate.setHours(0, 0, 0, 0)),
          end: new Date(currentDate.setHours(23, 59, 59, 999))
        };
      case 'week': {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
      }
      case 'month': {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return { start, end };
      }
      default:
        return {
          start: new Date(currentDate.setHours(0, 0, 0, 0)),
          end: new Date(currentDate.setHours(23, 59, 59, 999))
        };
    }
  };

  const printAgenda = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
  
    const { start, end } = getViewDateRange();
    const viewTitle = {
      day: 'päivän',
      week: 'viikon',
      month: 'kuukauden'
    }[viewMode];
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Vuosikello - ${viewTitle} agenda</title>
          <style>
            body { 
              font-family: 'IBM Plex Sans', 'sans-serif';
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .event-type { margin-top: 2em; }
            .event-list { margin-left: 2em; }
            .event-item { 
              padding: 0.5em;
              margin: 0.5em 0;
              border-radius: 4px;
              color: black;
            }
            @media print {
              @page { margin: 1cm; }
              .event-item { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body class="agenda-print">
          <h1>Vuosikello - ${currentDate.toLocaleDateString('fi-FI', { 
            month: 'long',
            year: 'numeric'
          })} ${viewTitle} tapahtumat</h1>
          ${Object.keys(events).map(type => `
            <div class="event-type">
              <h2>${getEventTypeName(type)}</h2>
              <div class="event-list">
                ${Object.values(events)
                  .flat()
                  .filter(event => {
                    const eventStart = parseLocalDate(event.startDate);
                    const eventEnd = parseLocalDate(event.endDate);
                    return event.type === type && 
                           eventStart <= end && 
                           eventEnd >= start;
                  })
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .map(event => `
                    <div class="event-item" style="background-color: ${eventTypeMap[type] || '#e2e8f0'}">
                      <strong>${event.name}</strong><br>
                      ${new Date(event.startDate).toLocaleDateString('fi-FI')} - 
                      ${new Date(event.endDate).toLocaleDateString('fi-FI')}
                    </div>
                  `).join('')}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };
  // Helper to normalize a date to midnight (00:00:00)
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

  // Update the EventItem component to better handle scaling and spacing
  const EventItem = ({ event, onClick, scale = 1 }) => (
    <div 
      onClick={onClick}
      className="event-row rounded-md cursor-pointer hover:opacity-80 hover:shadow-card transition-all duration-200 ease-in-out flex items-center justify-center bg-primary text-white font-medium text-xs sm:text-sm overflow-hidden m-0 p-0"
      style={{ 
        ...getEventTypeColor(event.type), 
        fontSize: scale < 1 ? `${scale}em` : undefined, 
        minHeight: '1.5em',
        height: 'auto',
        width: '100%',
        position: 'relative'
      }}
      title={event.name}
    >
      <span className="truncate block w-full text-center leading-tight px-1 py-0.5">{event.name}</span>
    </div>
  );

  // Update renderDayEvents to ensure all events are displayed properly
const renderDayEvents = (eventsForType, day, type) => {
  if (!visibleEventTypes.includes(type)) return null;
  const eventsArr = eventsForType || [];
  if (selectedEventType !== 'all' && type !== selectedEventType) return null;

  // Filter events for the specific day (normalize all dates to midnight)
  const matchingEvents = eventsArr.filter(event => {
    const startDate = normalizeDate(parseLocalDate(event.startDate));
    const endDate = normalizeDate(parseLocalDate(event.endDate));
    const thisDay = normalizeDate(day);
    return isSameDay(thisDay, startDate) || (thisDay >= startDate && thisDay <= endDate);
  });

  if (matchingEvents.length === 0) return null;

  // Adjust scaling for multiple events
  const scale = Math.max(0.6, 1 - (matchingEvents.length - 1) * 0.15);

  return (
    <div className="relative w-full flex flex-col gap-1">
      {matchingEvents.map((event, idx) => (
        <EventItem 
          key={event.id}
          event={event}
          onClick={() => handleEventClick(event)}
          scale={scale}
        />
      ))}
    </div>
  );
};
  
  // Update the month view rendering in renderContent
  const renderContent = () => {
    if (viewMode === 'month') {
      const { daysInMonth, firstDayWeekday } = getDaysInMonth(currentDate);
      const days = [];

      // Add empty cells for days before the first day of month
      for (let i = 0; i < firstDayWeekday; i++) {
        days.push(null);
      }

      // Add actual days
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      }

      return (
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 w-full mx-0 px-0">
          {['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].map(day => (
            <div key={day} className="p-2 text-center font-bold bg-sakura day-header font-sans text-xs sm:text-base uppercase tracking-wide text-textPrimary dark:bg-darkSurface dark:text-darkTextPrimary">
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <div key={index} className="relative p-1 sm:p-2 border min-h-[4rem] sm:min-h-32 day-cell text-xs sm:text-base font-sans text-textPrimary bg-surface/90 rounded-lg shadow-card dark:bg-darkSurface/90 dark:border-darkBorder dark:text-darkTextPrimary">
              {day ? (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                      <button
                        className="font-bold hover:bg-accentPink/30 rounded-md px-1 focus:outline-none font-sans text-textPrimary dark:text-darkTextPrimary"
                        style={{ lineHeight: 1.2 }}
                        onClick={() => handleDayClick(day)}
                        tabIndex={0}
                        aria-label={`Näytä päivän ${day.getDate()}.${day.getMonth() + 1}. tapahtumat`}
                      >
                        {day.getDate()}
                      </button>                      {hasTasksForDay(day) && (
                        <span
                          className="w-4 h-4 rounded-full mt-1 mb-0.5 mx-auto shadow-glow animate-glow cursor-pointer flex items-center justify-center text-xs font-bold text-primary bg-transparent border border-primary"
                          onClick={() => navigate('/tasks')}
                          title="Tehtäviä tälle päivälle"
                          style={{ boxShadow: '0 0 6px 2px #3b82f6', background: 'white' }}
                        >
                          T
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 flex flex-col mt-1">
                    {Object.keys(events).map(type => (
                      <div key={type} className="event-row min-h-[1.5rem]">
                        {renderDayEvents(events[type], day, type)}
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="min-h-[1.5rem]"></div>}
            </div>
          ))}
        </div>
      );
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate);
      const weekStart = new Date(weekDays[0]); weekStart.setHours(0,0,0,0);
      const weekEnd = new Date(weekDays[6]); weekEnd.setHours(23,59,59,999);
      
      return (
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 w-full mx-0 px-0">
          {['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].map(day => (
            <div key={day} className="p-2 text-center font-bold bg-sakura day-header font-sans text-xs sm:text-base uppercase tracking-wide text-textPrimary dark:bg-darkSurface dark:text-darkTextPrimary">
              {day}
            </div>
          ))}
          {weekDays.map((day, index) => {
            return (
              <div key={index} className="relative p-1 sm:p-2 border min-h-[6rem] sm:min-h-40 day-cell text-xs sm:text-base font-sans text-textPrimary bg-surface/90 rounded-lg shadow-card dark:bg-darkSurface/90 dark:border-darkBorder dark:text-darkTextPrimary">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    <button
                      className="font-bold hover:bg-accentPink/30 rounded-md px-1 focus:outline-none font-sans text-textPrimary dark:text-darkTextPrimary"
                      style={{ lineHeight: 1.2 }}
                      onClick={() => handleDayClick(day)}
                      tabIndex={0}
                      aria-label={`Näytä päivän ${day.getDate()}.${day.getMonth() + 1}. tapahtumat`}
                    >
                      {day.getDate()}
                    </button>                    {hasTasksForDay(day) && (
                      <span
                        className="w-4 h-4 rounded-full mt-1 mb-0.5 mx-auto shadow-glow animate-glow cursor-pointer flex items-center justify-center text-xs font-bold text-primary bg-transparent border border-primary"
                        onClick={() => navigate('/tasks')}
                        title="Tehtäviä tälle päivälle"
                        style={{ boxShadow: '0 0 6px 2px #3b82f6', background: 'white' }}
                      >
                        T
                      </span>
                    )}
                  </div>
                </div>
                {/* No task list in week view, only the ball */}
                <div className="space-y-1 flex flex-col mt-1">
                  {Object.keys(events).map(type => (
                    <div key={type} className="event-row min-h-[1.5rem]">
                      {renderDayEvents(events[type], day, type)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      const dayTasks = getTasksForDay(currentDate);
      return (
        <div className="space-y-4 bg-surface/90 rounded-lg shadow-card p-4 dark:bg-darkSurface dark:text-darkTextPrimary">
          <h2 className="text-h1 font-sans font-semibold uppercase tracking-wide text-textPrimary mb-2 dark:text-darkTextPrimary">
            {formatDate(currentDate)}
          </h2>
          <div className="space-y-2">
            {/* Other event types */}
            {Object.keys(events).map(type => (
              <div key={type} className="event-row min-h-[1.5rem] dark:bg-darkSurface/90 dark:text-darkTextPrimary">
                {renderDayEvents(events[type], currentDate, type)}
              </div>
            ))}
            <div className="mt-2">
              <h3 className="font-semibold mb-1 text-primary dark:text-darkPrimary">Tehtävät</h3>
              {dayTasks.length === 0 && <div className="text-gray-400 dark:text-darkTextSecondary">Ei tehtäviä tälle päivälle.</div>}
              <ul className="space-y-1">
                {dayTasks.map(task => (
                  <li key={task.id} className={`px-2 py-1 border rounded flex items-center gap-2 text-xs font-sans ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    <input type="checkbox" checked={task.completed} onChange={async () => {
                      await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
                      // Optionally, refetch tasks or update state
                      task.completed = !task.completed;
                      // Remove from list if completed
                      // setDayPanelTasks(dayPanelTasks => dayPanelTasks.filter(t => t.id !== task.id));
                      // For now, just reload page or refetch
                      window.location.reload();
                    }} className="accent-primary w-4 h-4" />
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                    <span className="font-semibold truncate">{task.title}</span>
                    <span className="text-xs opacity-80">({task.priority})</span>
                    {task.event_id && (
                      <span className="ml-2 text-xs italic opacity-70">
                        {(() => {
                          const ev = Object.values(events).flat().find(e => e.id === task.event_id);
                          return ev ? `→ ${ev.name}` : '';
                        })()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }
  };

  // When opening add event modal, always close the day panel first
  const openAddEventModal = (day = null) => {
    if (showAddModal) return; // Prevent multiple modals from opening
    setShowDayPanel(false); // Close day panel before opening new modal
    const defaultType = eventTypes.length > 0 ? eventTypes[0].name : 'general';
    setNewEvent({
      name: '',
      startDate: day ? getLocalDateString(day) : '',
      endDate: day ? getLocalDateString(day) : '',
      type: defaultType,
      tenant_id: tenantId,
      info: ''
    });
    setShowAddModal(true);
  };

  // Update ColorLegend to only show event types that exist in eventTypes
  const ColorLegend = () => (
    <div className="color-legend my-4 flex gap-4 justify-center border-t pt-4">
      {eventTypes.map(type => (
        <button
          key={type.id}
          className={`legend-item flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ease-in-out cursor-pointer hover:shadow-card
            ${visibleEventTypes.includes(type.name) 
              ? 'bg-accent/30 border-accent/30 border shadow-modal' 
              : 'bg-surface border-metal border opacity-50 hover:opacity-80 dark:bg-darkSurface dark:border-darkBorder'}`}
          onClick={() => {
            setVisibleEventTypes(prev =>
              prev.includes(type.name)
                ? prev.filter(t => t !== type.name)
                : [...prev, type.name]
            );
          }}
        >
          <div className="legend-color w-4 h-4 rounded-lg" style={{ backgroundColor: type.color }}></div>
          <span className="font-medium text-xs dark:text-darkTextPrimary">{type.name}</span>
        </button>
      ))}
    </div>
  );  return (    <div className="w-full mx-auto px-0 py-2 sm:p-4 max-w-full lg:max-w-7xl bg-background min-h-screen font-sans dark:bg-darkBackground">
      <style>
        {`
          @media print {
            .no-print, .sidebar, aside, nav, .Navigation, .Sidebar {
              display: none !important;
            }
            .calendar-container {
              width: 100% !important;
              max-width: none !important;
              padding: 0.5cm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            .calendar-header {
              font-size: 1rem !important;
              margin-bottom: 0.3cm !important;
            }
            .day-cell {
              min-height: auto !important;
              height: calc((29.7cm - 3cm) / 7) !important;
              padding: 0.2rem !important;
              font-size: 0.6rem !important;
            }
            .day-header {
              font-size: 0.7rem !important;
              padding: 0.1rem !important;
            }
            .event-row {
              min-height: 1rem !important;
              margin-bottom: 0.1rem !important;
              font-size: 0.6rem !important;
              line-height: 1 !important;
              padding: 0.1rem 0.2rem !important;
            }
            .color-legend {
              margin-top: 0.2rem !important;
              padding-top: 0.2rem !important;
              font-size: 0.6rem !important;
              gap: 0.5rem !important;
            }
            .legend-color {
              width: 0.6rem !important;
              height: 0.6rem !important;
            }
            .legend-item {
              gap: 0.2rem !important;
            }
            @page {
              size: portrait;
              margin: 0.5cm;
            }
          }
        `}
      </style>
      
      {/* Centered Aikumo Header, unified with calendar headers */}
      <div className="text-center mb-6">
        <h1 className="text-h1 font-sans font-semibold uppercase tracking-wide text-textPrimary select-none dark:text-darkTextPrimary">Aikumo</h1>
      </div>      <div className="border rounded-lg shadow-modal bg-surface calendar-container overflow-x-auto relative w-full mx-0 sm:mx-auto sm:max-w-5xl dark:bg-darkSurface dark:border-darkBorder"
        style={{ maxWidth: '100%' }}
      >
        <div className="flex items-center justify-center gap-4 mb-2 sm:mb-4 calendar-header">
          <button
            onClick={() => {
              let prev = new Date(currentDate);
              if (viewMode === 'month') {
                prev.setMonth(currentDate.getMonth() - 1);
              } else if (viewMode === 'week') {
                prev.setDate(currentDate.getDate() - 7);
              } else if (viewMode === 'day') {
                prev.setDate(currentDate.getDate() - 1);
              }
              setCurrentDate(prev);
            }}
            className="px-2 py-1 rounded-lg bg-primary text-white font-medium hover:bg-primaryHover transition-all duration-200 ease-in-out border border-metal dark:border-darkBorder"
            aria-label="Edellinen jakso"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-center text-h1 font-sans font-semibold uppercase tracking-wide text-textPrimary m-0 p-0 select-none dark:text-darkTextPrimary">
            {currentDate.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => {
              let next = new Date(currentDate);
              if (viewMode === 'month') {
                next.setMonth(currentDate.getMonth() + 1);
              } else if (viewMode === 'week') {
                next.setDate(currentDate.getDate() + 7);
              } else if (viewMode === 'day') {
                next.setDate(currentDate.getDate() + 1);
              }
              setCurrentDate(next);
            }}
            className="px-2 py-1 rounded-lg bg-primary text-white font-medium hover:bg-primaryHover transition-all duration-200 ease-in-out border border-metal dark:border-darkBorder"
            aria-label="Seuraava jakso"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {renderContent()}
        <ColorLegend />
        {/* Floating add event button, hidden when add modal is open */}
        {can('create') && !showAddModal && (
          <button
            onClick={() => openAddEventModal()}
            className="fixed bottom-6 right-6 z-50 bg-primary text-white font-medium rounded-full shadow-modal p-4 text-base hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary no-print flex items-center justify-center hover:scale-110 dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
            aria-label="Lisää tapahtuma"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        )}
      </div>
      {/* Hide sidebar toggle button when add modal is open */}
      {!showAddModal && !sidebarOpen && (
        <div className="fixed top-4 left-2 z-50 sm:top-6 sm:left-4">
          <button
            className="rounded-full bg-surface shadow-modal border border-accent p-2 sm:p-3 flex items-center justify-center transition-all duration-200 ease-in-out hover:bg-secondary dark:bg-darkSurface dark:border-darkAccent dark:hover:bg-darkHighlight"
            onClick={() => setSidebarOpen(true)}
            aria-label="Avaa sivupalkki"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
      {/* Add Detail Modal */}
      {showDetailModal && selectedEvent && (      <div className="fixed inset-0 bg-lowlightBg/80 flex items-center justify-center p-4 dark:bg-darkLowlightBg/80">
          <div className="bg-surface p-6 rounded-lg w-full max-w-2xl shadow-modal border border-border dark:bg-darkSurface dark:border-darkBorder">
            <div className="p-4 rounded-lg shadow-card" style={{ ...getEventTypeColor(selectedEvent.type), color: '#000' }}>
              <h3 className="text-xl font-semibold tracking-wide" style={{ color: '#000' }}>{selectedEvent.name}</h3>
              <p className="text-sm mt-2" style={{ color: '#000' }}>
                {new Date(selectedEvent.startDate).toLocaleDateString('fi-FI')} - {new Date(selectedEvent.endDate).toLocaleDateString('fi-FI')}
              </p>
              <p className="text-sm mt-1" style={{ color: '#000' }}>
                Tyyppi: {getEventTypeName(selectedEvent.type)}
              </p>
              {selectedEvent.info && (
                <div className="mt-2 p-2 bg-surface border rounded-lg text-sm" style={{ color: '#000' }}>
                  <span className="font-semibold" style={{ color: '#000' }}>Lisätiedot:</span> {selectedEvent.info}
                </div>
              )}
            </div>
            {/* Comment Section */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2" style={{ color: '#000' }}>Kommentit</h4>
              {commentLoading ? <div className="text-center text-lowlightText font-sans dark:text-darkLowlightText">Ladataan...</div> : (
                <ul className="mb-4 space-y-3">                  {comments.filter(c => !c.parent_comment_id).map(comment => (
                    <li key={comment.id} className="mb-2 p-2 bg-surface/80 rounded-lg border border-border shadow-card dark:bg-darkSurface/80 dark:border-darkBorder dark:text-darkTextPrimary">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-black font-sans dark:text-darkTextPrimary">
                          {getAuthorName(comment.profile, comment.user_id)}
                        </span>
                        <span className="text-xs text-lowlightText font-sans dark:text-darkLowlightText">{new Date(comment.created_at).toLocaleString('fi-FI')}</span>
                      </div>
                      <div className="ml-2 text-textPrimary font-sans dark:text-darkTextPrimary">{comment.content}</div>
                      <button className="text-accentPink text-xs ml-2 font-sans hover:underline" onClick={() => { setReplyTo(comment.id); commentInputRef.current?.focus(); }}>Vastaa</button>
                      {/* Replies */}
                      <ul className="ml-6 mt-1 space-y-2">
                        {comments.filter(c => c.parent_comment_id === comment.id).map(reply => (
                          <li key={reply.id} className="mb-1 p-2 bg-surface/60 rounded border border-border dark:bg-darkSurface/60 dark:border-darkBorder dark:text-darkTextPrimary">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-black font-sans dark:text-darkTextPrimary">
                                {getAuthorName(reply.profile, reply.user_id)}
                              </span>
                              <span className="text-xs text-lowlightText font-sans dark:text-darkLowlightText">{new Date(reply.created_at).toLocaleString('fi-FI')}</span>
                            </div>
                            <div className="ml-2 text-textPrimary font-sans dark:text-darkTextPrimary">{reply.content}</div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={e => { e.preventDefault(); addComment(selectedEvent.id, newComment, replyTo); }} className="flex gap-2 items-center mt-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out font-sans dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  placeholder={replyTo ? 'Vastaa kommenttiin...' : 'Lisää kommentti...'}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                {replyTo && <button type="button" className="text-xs text-lowlightText font-sans dark:text-darkLowlightText" onClick={() => setReplyTo(null)}>Peruuta vastaus</button>}
                <button type="submit" className="px-3 py-1 rounded-lg bg-primary text-white font-medium shadow-card hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary font-sans dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight">Lähetä</button>
              </form>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-surface text-textPrimary font-medium shadow-card hover:bg-highlight transition-all duration-200 ease-in-out border border-secondary dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkSecondary dark:hover:bg-darkHighlight"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEvent(null);
                }}
              >
                Sulje
              </button>
              {can('update') && (
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium shadow-card hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
                  onClick={handleEditClick}
                >
                  Muokkaa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lisää info ja repeat eventin luontimodaliin */}
      {showAddModal && (
        <div className="fixed inset-0 bg-lowlightBg/80 flex items-center justify-center p-4 dark:bg-darkLowlightBg/80">
          <div className="bg-surface/90 p-6 rounded-lg w-full max-w-md shadow-modal border border-border backdrop-blur-sm dark:bg-darkSurface/90 dark:border-darkBorder">
            <h3 className="modal-header text-lg font-semibold mb-4 dark:text-darkTextPrimary">Lisää uusi tapahtuma</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Nimi</label>
                <input
                  type="text"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Lisätiedot</label>
                <textarea
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={newEvent.info}
                  onChange={e => setNewEvent({...newEvent, info: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Alkamispäivä</label>
                <input
                  type="date"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={newEvent.startDate}
                  onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Päättymispäivä</label>
                <input
                  type="date"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={newEvent.endDate}
                  onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Tyyppi</label>
                <select
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={newEvent.type}
                  onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                >
                  {eventTypes.length > 0 ? (
                    eventTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))
                  ) : (
                    <option value="general">Yleinen</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Toistuva tapahtuma?</label>
                <input
                  type="checkbox"
                  checked={repeat.enabled}
                  onChange={e => setRepeat(r => ({ ...r, enabled: e.target.checked, frequency: e.target.checked ? 'daily' : 'none' }))}
                  className="mr-2"
                />
                <span className="font-medium dark:text-darkTextPrimary">Kyllä</span>
              </div>
              {repeat.enabled && (
                <div className="space-y-2">
                  <div>
                    <label className="block mb-1 font-medium dark:text-darkTextPrimary">Toistuvuus</label>
                    <select
                      className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                      value={repeat.frequency}
                      onChange={e => setRepeat(r => ({ ...r, frequency: e.target.value }))}
                    >
                      <option value="daily">Päivittäin</option>
                      <option value="weekly">Viikoittain</option>
                      <option value="monthly">Kuukausittain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium dark:text-darkTextPrimary">Toistojen määrä</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                      value={repeat.count}
                      onChange={e => setRepeat(r => ({ ...r, count: Number(e.target.value) }))}
                    />
                    <span className="text-xs text-lowlightText ml-2 dark:text-darkLowlightText">tai loppumispäivä</span>
                    <input
                      type="date"
                      className="border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out ml-2 dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                      value={repeat.until}
                      onChange={e => setRepeat(r => ({ ...r, until: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-lg bg-surface text-textPrimary font-sans font-medium shadow-card hover:bg-highlight transition-all duration-200 ease-in-out border border-secondary dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkSecondary dark:hover:bg-darkHighlight"
                  onClick={() => setShowAddModal(false)}
                >
                  Peruuta
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-primary text-white font-sans font-medium shadow-card hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
                  onClick={addEvent}
                >
                  Lisää tapahtuma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lisää info eventin muokkausmodaaliin */}
      {showEditModal && editEvent && can('update') && (
        <div className="fixed inset-0 bg-lowlightBg/80 flex items-center justify-center dark:bg-darkLowlightBg/80">
          <div className="bg-surface/90 p-6 rounded-lg max-w-md w-full shadow-modal border border-border backdrop-blur-sm dark:bg-darkSurface/90 dark:border-darkBorder">
            <h3 className="modal-header text-lg font-semibold mb-4 dark:text-darkTextPrimary">Muokkaa tapahtumaa</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Nimi</label>
                <input
                  type="text"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={editEvent.name}
                  onChange={e => setEditEvent({...editEvent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Lisätiedot</label>
                <textarea
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={editEvent.info || ''}
                  onChange={e => setEditEvent({...editEvent, info: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Alkamispäivä</label>
                <input
                  type="date"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={editEvent.startDate}
                  onChange={e => setEditEvent({...editEvent, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Päättymispäivä</label>
                <input
                  type="date"
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={editEvent.endDate}
                  onChange={e => setEditEvent({...editEvent, endDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium dark:text-darkTextPrimary">Tyyppi</label>
                <select
                  className="w-full border border-border p-2 rounded-lg bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all duration-200 ease-in-out dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
                  value={editEvent.type}
                  onChange={e => setEditEvent({...editEvent, type: e.target.value})}
                >
                  {eventTypes.length > 0 ? (
                    eventTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))
                  ) : (
                    <option value="general">Yleinen</option>
                  )}
                </select>
              </div>              <div className="flex justify-between">
                {can('delete') && (
                  <button
                    className="delete-event-btn px-4 py-2 rounded-lg font-sans font-medium shadow-card hover:bg-error/90 transition-all duration-200 ease-in-out border dark:bg-darkError dark:text-darkTextPrimary dark:border-darkBorder"
                    onClick={() => {
                      deleteEvent(editEvent);
                      setShowEditModal(false);
                    }}
                  >
                    Poista
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg bg-secondary text-textPrimary font-sans font-medium shadow-card hover:bg-accent transition-all duration-200 ease-in-out border border-secondary dark:bg-darkSecondary dark:text-darkTextPrimary dark:border-darkSecondary dark:hover:bg-darkAccent"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditEvent(null);
                    }}
                  >
                    Peruuta
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-primary text-white font-sans font-medium shadow-card hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
                    onClick={updateEvent}
                  >
                    Tallenna
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Add Day Panel */}
      {showDayPanel && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-lowlightBg/80 dark:bg-darkLowlightBg/80">
          <div className="relative w-full max-w-xs sm:max-w-md bg-surface/90 backdrop-blur-sm shadow-modal overflow-y-auto p-3 sm:p-4 no-print rounded-lg border border-border max-h-[90vh] dark:bg-darkSurface/90 dark:border-darkBorder">
            <button className="absolute top-2 right-2 text-xl font-bold text-error hover:text-error/80 transition-all duration-200 ease-in-out dark:text-darkError dark:hover:text-darkError/80" onClick={() => setShowDayPanel(false)}>&times;</button>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 dark:text-darkTextPrimary">{selectedDay.toLocaleDateString('fi-FI')}</h2>
            <button
              className="mb-2 px-3 sm:px-4 py-2 rounded-lg bg-primary text-white font-medium shadow-card hover:bg-primaryHover transition-all duration-200 ease-in-out border border-primary w-full dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
              onClick={() => openAddEventModal(selectedDay)}
            >
              Lisää tapahtuma tälle päivälle
            </button>
            <button
              className="mb-4 px-3 sm:px-4 py-2 rounded-lg bg-secondary text-white font-medium shadow-card hover:bg-secondaryHover transition-all duration-200 ease-in-out border border-secondary w-full dark:bg-darkSecondary dark:text-darkTextPrimary dark:border-darkSecondary dark:hover:bg-darkHighlight"
              onClick={() => setShowAddTaskModal(true)}
            >
              Lisää tehtävä tälle päivälle
            </button>
            <h3 className="font-semibold mb-2 dark:text-darkTextPrimary">Tapahtumat</h3>
            <ul>
              {dayPanelEvents.length === 0 && <li className="dark:text-darkTextSecondary">Ei tapahtumia tälle päivälle.</li>}
              {dayPanelEvents.map(event => (
                <li key={event.id} className="mb-2 p-2 border rounded-lg cursor-pointer flex items-center gap-2 event-list-item hover:bg-accent/10 transition-all duration-200 ease-in-out dark:bg-darkSurface/80 dark:border-darkBorder dark:text-darkTextPrimary hover:dark:bg-darkAccent/10" onClick={e => { e.stopPropagation(); setShowDayPanel(false); handleEventClick(event); }}>
                  <span className="w-4 h-4 rounded-lg border border-border dark:border-darkBorder" style={{ backgroundColor: eventTypeMap[event.type] || '#e2e8f0' }}></span>
                  <span className="font-semibold">{event.name}</span> <span className="text-xs">({event.type})</span>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold mb-2 dark:text-darkTextPrimary">Tehtävät</h3>
            <ul>
              {dayPanelTasks.filter(task => !task.completed).length === 0 && <li className="dark:text-darkTextSecondary">Ei tehtäviä tälle päivälle.</li>}
              {dayPanelTasks.filter(task => !task.completed).map(task => (
                <li
                  key={task.id}
                  className="mb-1 px-2 py-1 border rounded flex items-center gap-2 task-list-item cursor-pointer hover:bg-accent/10 transition-all duration-200 ease-in-out dark:bg-darkSurface/80 dark:border-darkBorder dark:text-darkTextPrimary hover:dark:bg-darkAccent/10"
                  style={{
                    ...getTaskPriorityColor(task.priority),
                    minHeight: '1.5rem',
                    fontSize: '0.85em',
                    lineHeight: 1.1,
                    padding: '0.2rem 0.5rem'
                  }}
                  onClick={() => navigate('/tasks')}
                >
                  <span className="font-semibold truncate">{task.title}</span>
                  <span className="text-xs opacity-80">({task.priority})</span>
                  {task.event_id && (
                    <span className="ml-2 text-xs italic opacity-70">
                      {(() => {
                        const ev = Object.values(events).flat().find(e => e.id === task.event_id);
                        return ev ? `→ ${ev.name}` : '';
                      })()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Add Task Modal for selected day */}
      {showAddTaskModal && (
        <TaskModal
          open={showAddTaskModal}
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={handleAddTask}
          task={newTask}
          setTask={setNewTask}
          events={Object.values(events).flat()}
          title="Lisää uusi tehtävä"
          loading={false}
        />
      )}
    </div>
  );
};

export default AikajanaKalenteri;