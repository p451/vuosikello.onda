import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import { useRole } from '../contexts/RoleContext';

const AikajanaKalenteri = () => {
  const [viewMode, setViewMode] = useState('month');
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'general',
    tenant_id: null
  });

  // Add new state for detail view
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [eventTypes, setEventTypes] = useState([]);
  const eventTypeMap = Object.fromEntries(eventTypes.map(type => [type.name, type.color]));

  const { tenantId } = useTenant();
  const { can } = useRole();

  const [events, setEvents] = useState({});

  const [selectedEventType, setSelectedEventType] = useState('all');

  const [showDayPanel, setShowDayPanel] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayPanelEvents, setDayPanelEvents] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      await fetchEvents();
    };
    init();
  }, [tenantId]);

  // Get tenant_id from user metadata on component mount
  useEffect(() => {
    const getTenantId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.tenant_id) {
        setNewEvent(prev => ({ ...prev, tenant_id: user.user_metadata.tenant_id }));
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

  const fetchEvents = async () => {
    if (!tenantId) {
      console.log('No tenant ID available');
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
        console.log('No events found');
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
          tenant_id: event.tenant_id
        });
      });

      setEvents(grouped);
    } catch (error) {
      console.error('Error fetching events:', error);
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

  const addEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: newEvent.name,
          start_date: newEvent.startDate,
          end_date: newEvent.endDate,
          type: newEvent.type,
          tenant_id: tenantId
        }])
        .select();

      if (error) throw error;

      const category = newEvent.type;
      setEvents(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), {
          id: data[0].id,
          name: data[0].name,
          startDate: data[0].start_date,
          endDate: data[0].end_date,
          type: data[0].type,
          tenant_id: data[0].tenant_id
        }]
      }));

      setShowAddModal(false);
      setNewEvent({ name: '', startDate: '', endDate: '', type: 'general', tenant_id: tenantId });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const updateEvent = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: editEvent.name,
          start_date: editEvent.startDate,
          end_date: editEvent.endDate,
          type: editEvent.type,
          tenant_id: tenantId
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
  };

  // Fetch comments for an event
  const fetchComments = async (eventId) => {
    setCommentLoading(true);
    const { data, error } = await supabase
      .from('event_comments')
      .select('*, profiles: user_id (email)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setCommentLoading(false);
  };

  // Add comment
  const addComment = async (eventId, content, parentId = null) => {
    setCommentLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('event_comments').insert([
      {
        event_id: eventId,
        user_id: user.id,
        tenant_id: tenantId,
        content,
        parent_comment_id: parentId
      }
    ]);
    setNewComment('');
    setReplyTo(null);
    await fetchComments(eventId);
    setCommentLoading(false);
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

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayPanel(true);
    // Gather all events for this day
    const eventsForDay = Object.values(events).flat().filter(event => {
      const start = parseLocalDate(event.startDate);
      const end = parseLocalDate(event.endDate);
      return day >= start && day <= end;
    });
    setDayPanelEvents(eventsForDay);
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

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + direction * 7);
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (type) => {
    // Use tenant_event_types color if available
    if (eventTypeMap[type]) return { backgroundColor: eventTypeMap[type] };
    return { backgroundColor: '#e2e8f0' };
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
              font-family: Arial, sans-serif;
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

  // Update the EventItem component to handle small holiday indicators
  const EventItem = ({ event, onClick, scale = 1 }) => (
    <div 
      onClick={onClick}
      className={`event-row rounded cursor-pointer hover:opacity-80 p-1 text-xs sm:text-sm`}
      style={{ ...getEventTypeColor(event.type), fontSize: `${scale * 0.75}rem`, minHeight: `${scale * 1.25}rem` }}
    >
      <span className="truncate block">{event.name}</span>
    </div>
  );

  // Update ColorLegend to only show event types that exist in eventTypes
  const ColorLegend = () => (
    <div className="color-legend my-4 flex gap-4 justify-center border-t pt-4">
      {eventTypes.map(type => (
        <div key={type.id} className="legend-item flex items-center gap-1">
          <div className="legend-color w-4 h-4 rounded" style={{ backgroundColor: type.color }}></div>
          <span>{type.name}</span>
        </div>
      ))}
    </div>
  );

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

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

  // Update renderDayEvents to default events to []
  const renderDayEvents = (eventsForType, day, type) => {
    const eventsArr = eventsForType || [];
    if (selectedEventType !== 'all' && type !== selectedEventType) return null;
    const matchingEvents = eventsArr.filter(event => {
      const startDate = parseLocalDate(event.startDate);
      const endDate = parseLocalDate(event.endDate);
      return (isSameDay(day, startDate) || 
        (day >= startDate && day <= endDate)) &&
        (selectedLayer === 'all' || selectedLayer === type);
    });
    if (matchingEvents.length === 0) return null;
    const scale = Math.max(0.6, 1 - (matchingEvents.length - 1) * 0.2);
    return (
      <div className={`flex flex-col gap-0.5`}>
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
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'].map(day => (
            <div key={day} className="p-2 text-center font-bold bg-gray-100 day-header">
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <div key={index} className="p-1 sm:p-2 border min-h-[4rem] sm:min-h-32 day-cell text-xs sm:text-base"
              style={{ cursor: day ? 'pointer' : 'default' }}
              onClick={day ? () => handleDayClick(day) : undefined}
            >
              {day ? (
                <>
                  <div className="flex justify-between items-start">
                    <div className="font-bold">{day.getDate()}</div>
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
      
      return (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => (
            <div key={index} className="border p-2 sm:p-4 min-h-[300px] sm:min-h-[400px]">
              <div className="font-bold text-center mb-4 sm:mb-6 text-base sm:text-xl">
                {day.toLocaleDateString('fi-FI', { weekday: 'short' })}<br />
                {day.getDate()}.{day.getMonth() + 1}.
              </div>
              <div className="space-y-2">
                {/* Other event types */}
                {Object.keys(events).map(type => (
                  <div key={type} className="event-row min-h-[1.5rem]">
                    {renderDayEvents(events[type], day, type)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{formatDate(currentDate)}</h2>
          <div className="space-y-2">
            {/* Other event types */}
            {Object.keys(events).map(type => (
              <div key={type} className="event-row min-h-[1.5rem]">
                {renderDayEvents(events[type], currentDate, type)}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // When opening add event modal, set default type to first event type (if any)
  const openAddEventModal = (day = null) => {
    const defaultType = eventTypes.length > 0 ? eventTypes[0].name : 'general';
    setNewEvent({
      name: '',
      startDate: day ? getLocalDateString(day) : '',
      endDate: day ? getLocalDateString(day) : '',
      type: defaultType,
      tenant_id: tenantId
    });
    setShowAddModal(true);
  };

  return (
    <div className="w-full mx-auto p-2 sm:p-4 max-w-full lg:max-w-7xl">
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .calendar-container {
              width: 100% !important;
              max-width: none !important;
              padding: 0.5cm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .calendar-header {
              font-size: 1rem !important;
              margin-bottom: 0.3cm !important;
            }
            .day-cell {
              min-height: auto !important;
              height: calc((29.7cm - 3cm) / 7) !important; /* A4 height minus margins and header/footer */
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
      <div className="mb-4 space-y-2 sm:space-y-4 no-print">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base ${
              viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('day')}
          >
            Päivä
          </button>
          <button
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base ${
              viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('week')}
          >
            Viikko
          </button>
          <button
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base ${
              viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setViewMode('month')}
          >
            Kuukausi
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            className="px-2 py-1 rounded border"
            value={selectedEventType}
            onChange={e => setSelectedEventType(e.target.value)}
          >
            <option value="all">Kaikki tapahtumatyypit</option>
            {eventTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
          <button
            className={`px-2 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base ${
              selectedLayer === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setSelectedLayer('all')}
          >
            Kaikki
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded bg-green-500 text-white"
          >
            Tulosta kalenteri
          </button>
          <button
            onClick={printAgenda}
            className="px-4 py-2 rounded bg-green-500 text-white"
          >
            Tulosta agenda
          </button>
          {can('create') && (
            <button
              onClick={() => openAddEventModal()}
              className="px-4 py-2 rounded bg-blue-500 text-white"
            >
              Lisää tapahtuma
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded bg-gray-200"
          >
            &lt; Edellinen
          </button>
          <span className="font-bold">
            {currentDate.toLocaleDateString('fi-FI', { 
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <button
            onClick={() => navigate(1)}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Seuraava &gt;
          </button>
        </div>
      </div>

      <div className="border rounded-lg shadow-lg bg-white p-2 sm:p-4 calendar-container overflow-x-auto">
        <h2 className="text-center text-lg sm:text-2xl font-bold mb-2 sm:mb-4 calendar-header">
          {currentDate.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })}
        </h2>
        {renderContent()}
        <ColorLegend />
      </div>

      {/* Add Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <div className="p-4 rounded-t-lg" style={getEventTypeColor(selectedEvent.type)}>
              <h3 className="text-xl font-bold">{selectedEvent.name}</h3>
              <p className="text-sm mt-2">
                {new Date(selectedEvent.startDate).toLocaleDateString('fi-FI')} - {new Date(selectedEvent.endDate).toLocaleDateString('fi-FI')}
              </p>
              <p className="text-sm mt-1">
                Tyyppi: {getEventTypeName(selectedEvent.type)}
              </p>
            </div>
            {/* Comment Section */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Kommentit</h4>
              {commentLoading ? <div>Ladataan...</div> : (
                <ul className="mb-4">
                  {comments.filter(c => !c.parent_comment_id).map(comment => (
                    <li key={comment.id} className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{comment.profiles?.email || comment.user_id}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString('fi-FI')}</span>
                      </div>
                      <div className="ml-2">{comment.content}</div>
                      <button className="text-blue-500 text-xs ml-2" onClick={() => { setReplyTo(comment.id); commentInputRef.current?.focus(); }}>Vastaa</button>
                      {/* Replies */}
                      <ul className="ml-6 mt-1">
                        {comments.filter(c => c.parent_comment_id === comment.id).map(reply => (
                          <li key={reply.id} className="mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{reply.profiles?.email || reply.user_id}</span>
                              <span className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString('fi-FI')}</span>
                            </div>
                            <div className="ml-2">{reply.content}</div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={e => { e.preventDefault(); addComment(selectedEvent.id, newComment, replyTo); }} className="flex gap-2 items-center">
                <input
                  ref={commentInputRef}
                  type="text"
                  className="flex-1 border p-2 rounded"
                  placeholder={replyTo ? 'Vastaa kommenttiin...' : 'Lisää kommentti...'}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                {replyTo && <button type="button" className="text-xs text-gray-500" onClick={() => setReplyTo(null)}>Peruuta vastaus</button>}
                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">Lähetä</button>
              </form>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEvent(null);
                }}
              >
                Sulje
              </button>
              {can('update') && (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={handleEditClick}
                >
                  Muokkaa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Lisää uusi tapahtuma</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Nimi</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1">Alkamispäivä</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={newEvent.startDate}
                  onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1">Päättymispäivä</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={newEvent.endDate}
                  onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1">Tyyppi</label>
                <select
                  className="w-full border p-2 rounded"
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
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Peruuta
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={addEvent}
                >
                  Lisää
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editEvent && can('update') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Muokkaa tapahtumaa</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Nimi</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={editEvent.name}
                  onChange={e => setEditEvent({...editEvent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1">Alkamispäivä</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={editEvent.startDate}
                  onChange={e => setEditEvent({...editEvent, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1">Päättymispäivä</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  value={editEvent.endDate}
                  onChange={e => setEditEvent({...editEvent, endDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block mb-1">Tyyppi</label>
                <select
                  className="w-full border p-2 rounded"
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
              </div>
              <div className="flex justify-between">
                {can('delete') && (
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded"
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
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditEvent(null);
                    }}
                  >
                    Peruuta
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={updateEvent}
                  >
                    Tallenna
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Day Panel */}
      {showDayPanel && selectedDay && (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg z-50 overflow-y-auto p-4">
          <button className="absolute top-2 right-2 text-xl" onClick={() => setShowDayPanel(false)}>&times;</button>
          <h2 className="text-xl font-bold mb-2">{selectedDay.toLocaleDateString('fi-FI')}</h2>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => openAddEventModal(selectedDay)}
          >
            Lisää tapahtuma tälle päivälle
          </button>
          <h3 className="font-semibold mb-2">Tapahtumat</h3>
          <ul>
            {dayPanelEvents.length === 0 && <li>Ei tapahtumia tälle päivälle.</li>}
            {dayPanelEvents.map(event => (
              <li key={event.id} className="mb-2 p-2 border rounded cursor-pointer flex items-center gap-2" onClick={() => handleEventClick(event)}>
                <span style={{ background: eventTypeMap[event.type] || '#e2e8f0', width: 16, height: 16, display: 'inline-block', borderRadius: 4, border: '1px solid #ccc' }}></span>
                <span className="font-bold">{event.name}</span> <span className="text-xs">({event.type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AikajanaKalenteri;