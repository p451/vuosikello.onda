import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useNavigate } from 'react-router-dom';
import './SidebarTaskBoard.css'; // Add CSS for animations

const SidebarTaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('completed', false)
          .order('deadline', { ascending: true })
          .limit(5);

        if (error) throw error;
        setTasks(data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, []);

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  return (
    <div className="p-2 bg-surface rounded-lg shadow-card dark:bg-darkSurface font-sans w-full">
      <h3 className="text-lg font-serif font-bold mb-3 text-black uppercase tracking-wide">Task Board</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-darkTextSecondary">No tasks available.</p>
      ) : (
        <TransitionGroup component="ul" className="space-y-1 w-full">
          {tasks.slice(0, 5).map(task => {
            return (
              <CSSTransition key={task.id} timeout={300} classNames="task">
                <li
                  className="flex items-center gap-2 px-2 py-1 rounded min-w-0 cursor-pointer hover:bg-accent/10 transition-all font-sans"
                  style={{
                    width: 'fit-content',
                    background: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef9c3' : '#dcfce7',
                    color: task.priority === 'high' ? '#b91c1c' : task.priority === 'medium' ? '#92400e' : '#166534',
                    fontWeight: 600
                  }}
                  onClick={() => navigate('/tasks')}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                  <span className="font-semibold text-sm truncate max-w-[120px]">{task.title}</span>
                  {task.deadline && (
                    <span className="text-xs text-gray-500 ml-1">{new Date(task.deadline).toLocaleDateString('fi-FI')}</span>
                  )}
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id, task.completed)}
                    className="ml-2 h-4 w-4 text-primary focus:ring-primary dark:focus:ring-darkPrimary flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                </li>
              </CSSTransition>
            );
          })}
        </TransitionGroup>
      )}
    </div>
  );
};

export default SidebarTaskBoard;
