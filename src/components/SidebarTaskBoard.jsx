import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './SidebarTaskBoard.css'; // Add CSS for animations

const SidebarTaskBoard = () => {
  const [tasks, setTasks] = useState([]);

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
    <div className="p-4 bg-surface rounded-lg shadow-card dark:bg-darkSurface">
      <h3 className="text-lg font-serif font-bold mb-4 text-primary dark:text-darkPrimary uppercase tracking-wide">Task Board</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-darkTextSecondary">No tasks available.</p>
      ) : (
        <TransitionGroup component="ul" className="space-y-4">
          {tasks.map(task => (
            <CSSTransition key={task.id} timeout={300} classNames="task">
              <li className="p-4 border rounded-lg bg-white dark:bg-darkSurface dark:border-darkBorder flex items-center justify-between shadow-subtle">
                <div>
                  <h4 className={`font-medium text-base ${task.completed ? 'line-through text-gray-500' : 'text-textPrimary dark:text-darkTextPrimary'}`}>{task.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-darkTextSecondary">
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(task.id, task.completed)}
                  className="ml-4 h-5 w-5 text-primary focus:ring-primary dark:focus:ring-darkPrimary"
                />
              </li>
            </CSSTransition>
          ))}
        </TransitionGroup>
      )}
    </div>
  );
};

export default SidebarTaskBoard;
