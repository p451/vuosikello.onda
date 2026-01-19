import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import { useRole } from '../contexts/RoleContext';
import TaskModal from './TaskModal';
import { notifyTaskCreated, notifyTaskCompleted } from '../lib/notificationUtils';

const Tasks = () => {
  const [tasks, setTasks] = useState({ incomplete: [], completed: [] });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    category: '', // Assigned for
    event_id: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);  const { tenantId } = useTenant();
  const { userRole } = useRole();
  const canManageTasks = ['admin', 'editor'].includes(userRole);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!tenantId) {
      setError('Tenant ID is not available. Please ensure you are logged in and have the correct permissions.');
      setLoading(false);
      return;
    }
    fetchTasks();
    
    // Setup Realtime subscription for tasks
    const channel = supabase
      .channel(`tasks:tenant_id=eq.${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload) => {
          const newTask = payload.new;
          // Lisää tehtävä listalle
          setTasks(prev => ({
            ...prev,
            incomplete: [...(prev.incomplete || []), newTask]
          }));
          // Lähetä notifikaatio
          notifyTaskCreated(newTask.title);
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
          const updatedTask = payload.new;
          // Päivitä tehtävä listalla
          if (updatedTask.completed) {
            setTasks(prev => ({
              ...prev,
              incomplete: prev.incomplete.filter(t => t.id !== updatedTask.id),
              completed: [...prev.completed, updatedTask]
            }));
            notifyTaskCompleted(updatedTask.title);
          } else {
            setTasks(prev => ({
              ...prev,
              incomplete: prev.incomplete.map(t => t.id === updatedTask.id ? updatedTask : t),
              completed: prev.completed.filter(t => t.id !== updatedTask.id)
            }));
          }
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
          const deletedTaskId = payload.old.id;
          setTasks(prev => ({
            incomplete: prev.incomplete.filter(t => t.id !== deletedTaskId),
            completed: prev.completed.filter(t => t.id !== deletedTaskId)
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('tenant_id', tenantId);
      if (!error && data) setEvents(data);
    };
    fetchEvents();
  }, [tenantId]);

  const fetchTasks = async () => {
    try {
      const { data: incomplete, error: error1 } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('completed', false)
        .order('deadline', { ascending: true });
      const { data: completed, error: error2 } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('completed', true)
        .order('deadline', { ascending: true });
      if (error1 || error2) throw error1 || error2;
      setTasks({ incomplete, completed });
    } catch (error) {
      setError('Error fetching tasks');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!canManageTasks) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...newTask, completed: false, tenant_id: tenantId }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setTasks(prev => ({ ...prev, incomplete: [...(prev.incomplete || []), data] }));
        setShowAddTaskModal(false); // Close modal after creation
        // Lähetä notifikaatio uudesta tehtävästä
        notifyTaskCreated(data.title);
      }
      setNewTask({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
        category: '',
        event_id: null,
      });
    } catch (error) {
      setError('Error creating task');
      console.error('Error:', error);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prevTasks => {
        const updatedTask = prevTasks.incomplete.find(task => task.id === taskId) || prevTasks.completed.find(task => task.id === taskId);
        updatedTask.completed = !currentStatus;
        
        // Lähetä notifikaatio kun tehtävä merkitään valmiiksi
        if (!currentStatus) {
          notifyTaskCompleted(updatedTask.title);
        }
        
        if (currentStatus) {
          return {
            incomplete: [...prevTasks.incomplete, updatedTask],
            completed: prevTasks.completed.filter(task => task.id !== taskId)
          };
        } else {
          return {
            incomplete: prevTasks.incomplete.filter(task => task.id !== taskId),
            completed: [...prevTasks.completed, updatedTask]
          };
        }
      });
    } catch (err) {
      console.error('Error toggling task completion:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!canManageTasks) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => ({
        incomplete: prev.incomplete.filter(task => task.id !== taskId),
        completed: prev.completed.filter(task => task.id !== taskId)
      }));
    } catch (error) {
      setError('Error deleting task');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div className="px-4 py-0 m-0 w-full font-sans text-textPrimary dark:text-darkTextPrimary pt-20 sm:pt-0 sm:px-0">
      <h2 className="text-2xl font-bold mb-2 font-sans text-primary dark:text-darkPrimary">Tehtävät</h2>
      {canManageTasks && (
        <>
          <button
            className="mb-2 bg-primary text-white px-3 py-1 rounded hover:bg-primaryHover font-sans font-medium shadow-card border border-primary dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight"
            onClick={() => setShowAddTaskModal(true)}
          >
            Lisää tehtävä
          </button>
          <TaskModal
            open={showAddTaskModal}
            onClose={() => setShowAddTaskModal(false)}
            onSubmit={createTask}
            task={newTask}
            setTask={setNewTask}
            events={events}
            title="Lisää uusi tehtävä"
            loading={loading}
            categoryLabel="Assigned for:"
          />
        </>
      )}
      <div className="space-y-1 w-full">
        <h3 className="font-semibold mb-1 text-base font-sans text-primary dark:text-darkPrimary">Aktiiviset tehtävät</h3>
        {(tasks.incomplete || []).map(task => {
          const relatedEvent = events.find(ev => ev.id === task.event_id);
          return (
            <div
              key={task.id}
              className="w-full p-2 rounded border bg-white dark:bg-darkSurface dark:border-darkBorder font-sans flex flex-col gap-0.5 m-0 text-base"
              style={{minWidth:'0',width:'100%'}}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5 w-full">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={task.completed} onChange={async () => {
                      await supabase.from('tasks').update({ completed: true }).eq('id', task.id);
                      setTasks(prev => ({
                        ...prev,
                        incomplete: prev.incomplete.filter(t => t.id !== task.id),
                        completed: [...prev.completed, {...task, completed: true}]
                      }));
                    }} className="accent-primary w-5 h-5" />
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                    <span className="text-base font-semibold leading-tight truncate">{task.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-darkTextSecondary leading-tight">{task.description}</span>
                  {task.deadline && (
                    <span className="text-xs text-gray-500 dark:text-darkTextSecondary leading-tight">{new Date(task.deadline).toLocaleDateString('fi-FI')}</span>
                  )}
                  {relatedEvent && (
                    <span className="text-xs italic text-accentPink dark:text-accentPink leading-tight">→ {relatedEvent.name}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold leading-tight ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                  {task.category && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs leading-tight">{task.category}</span>
                  )}
                  {canManageTasks && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 text-xs mt-1"
                    >
                      Poista
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-1 mt-2 w-full">
        <h3 className="font-semibold mb-1 text-base font-sans text-primary dark:text-darkPrimary">Valmiit tehtävät</h3>
        {(tasks.completed || []).length === 0 && <div className="text-gray-400 dark:text-darkTextSecondary">Ei valmiita tehtäviä.</div>}
        {(tasks.completed || []).map(task => {
          const relatedEvent = events.find(ev => ev.id === task.event_id);
          return (
            <div key={task.id} className="w-full p-1 rounded border bg-gray-50 line-through text-gray-500 dark:bg-darkSurface dark:border-darkBorder dark:text-darkTextSecondary font-sans flex flex-col gap-0.5 m-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold leading-tight">{task.title}</span>
                  <span className="text-xs leading-tight">{task.description}</span>
                  {task.deadline && (
                    <span className="text-xs leading-tight">{new Date(task.deadline).toLocaleDateString('fi-FI')}</span>
                  )}
                  {relatedEvent && (
                    <span className="text-xs italic text-accentPink leading-tight">→ {relatedEvent.name}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold leading-tight ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                  {task.category && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs leading-tight">{task.category}</span>
                  )}
                  {canManageTasks && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 text-xs mt-1"
                    >
                      Poista
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
