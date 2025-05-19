import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { TenantContext } from '../contexts/TenantContext';
import { RoleContext } from '../contexts/RoleContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    category: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentTenant } = useContext(TenantContext);
  const { userRole } = useContext(RoleContext);
  const canManageTasks = ['admin', 'editor'].includes(userRole);

  useEffect(() => {
    fetchTasks();
  }, [currentTenant]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) throw error;
      setTasks(data);
    } catch (error) {
      setError('Error fetching tasks');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!canManageTasks) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          tenant_id: currentTenant
        }]);

      if (error) throw error;

      setTasks(prev => [...prev, data[0]]);
      setNewTask({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
        category: '',
      });
    } catch (error) {
      setError('Error creating task');
      console.error('Error:', error);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    if (!canManageTasks) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        )
      );
    } catch (error) {
      setError('Error updating task');
      console.error('Error:', error);
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

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      setError('Error deleting task');
      console.error('Error:', error);
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tasks</h2>

      {canManageTasks && (
        <form onSubmit={createTask} className="mb-8 space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <input
              type="text"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              placeholder="Task title"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <textarea
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
              placeholder="Description"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="date"
                name="deadline"
                value={newTask.deadline}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <select
                name="priority"
                value={newTask.priority}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                name="category"
                value={newTask.category}
                onChange={handleInputChange}
                placeholder="Category"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Task
          </button>
        </form>
      )}

      <div className="space-y-4">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`p-4 rounded-lg border ${
              task.completed ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {canManageTasks && (
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(task.id, task.completed)}
                    className="h-5 w-5"
                  />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${
                    task.completed ? 'line-through text-gray-500' : ''
                  }`}>
                    {task.title}
                  </h3>
                  <p className="text-gray-600">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded text-sm ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
                {task.category && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                    {task.category}
                  </span>
                )}
                {task.deadline && (
                  <span className="text-gray-500 text-sm">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
                {canManageTasks && (
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
