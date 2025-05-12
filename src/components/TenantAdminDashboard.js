import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import { useRole } from '../contexts/RoleContext';

export default function TenantAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const { tenantId } = useTenant();
  const { userRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [eventTypes, setEventTypes] = useState([]);
  const [newEventType, setNewEventType] = useState('');
  const [newEventTypeColor, setNewEventTypeColor] = useState('#2196f3');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    if (!userRole || !tenantId) {
      window.location.href = '/login';
      return;
    }
    if (userRole !== 'admin') {
      window.location.href = '/';
      return;
    }
    fetchUsers();
    fetchEventTypes();
  }, [tenantId, userRole]);

  const fetchUsers = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('id,role,user_id,tenant_id,profiles(email)')
        .eq('tenant_id', tenantId);

      if (userError) throw userError;

      setUsers(userData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error loading users');
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from('tenant_event_types')
      .select('*')
      .eq('tenant_id', tenantId);
    if (!error) setEventTypes(data);
  };

  const addUserDirectly = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Odota hetki, että profiili ehtii syntyä ennen user_roles-inserttiä
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: selectedRole,
          tenant_id: tenantId
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Käyttäjän luonti epäonnistui');
      setMessage('Käyttäjä lisätty ja kutsu lähetetty!');
      setInviteEmail('');
      setSelectedRole('viewer');
      fetchUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      await fetchUsers();
      setMessage('Role updated successfully');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeUser = async (userId) => {
    setUserToDelete(userId);
    setDeleteInput('');
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (deleteInput !== 'delete' || !userToDelete) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/delete_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userToDelete })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Käyttäjän poisto epäonnistui');
      setMessage('Käyttäjä poistettu onnistuneesti!');
      setUsers(prev => prev.filter(user => user.user_id !== userToDelete));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeleteInput('');
      setLoading(false);
    }
  };

  const addEventType = async (e) => {
    e.preventDefault();
    if (!newEventType) return;
    const { error } = await supabase
      .from('tenant_event_types')
      .insert([{ tenant_id: tenantId, name: newEventType, color: newEventTypeColor }]);
    if (!error) {
      setNewEventType('');
      setNewEventTypeColor('#2196f3');
      fetchEventTypes();
    }
  };

  const removeEventType = async (id) => {
    await supabase.from('tenant_event_types').delete().eq('id', id);
    fetchEventTypes();
  };

  if (loading) return <div>Loading...</div>;
  if (userRole !== 'admin') return null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tenant Administration</h1>
      
      {message && (
        <div className="mb-4 p-4 rounded bg-blue-100 text-blue-700">
          {message}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Invite New User</h2>
        <form onSubmit={addUserDirectly} className="space-y-4">
          <div>
            <label className="block mb-2">Email:</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Lisää käyttäjä
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Event Types</h2>
        <form onSubmit={addEventType} className="flex space-x-2 mb-2 items-center">
          <input
            type="text"
            value={newEventType}
            onChange={e => setNewEventType(e.target.value)}
            placeholder="New event type"
            className="p-2 border rounded"
          />
          <input
            type="color"
            value={newEventTypeColor}
            onChange={e => setNewEventTypeColor(e.target.value)}
            className="w-8 h-8 border rounded"
            title="Pick color"
          />
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">Add</button>
        </form>
        <ul>
          {eventTypes.map(type => (
            <li key={type.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span style={{ background: type.color || '#2196f3', width: 16, height: 16, display: 'inline-block', borderRadius: 4, border: '1px solid #ccc' }}></span>
                {type.name}
              </span>
              <button onClick={() => removeEventType(type.id)} className="text-red-500">Remove</button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Current Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left">Email</th>
                <th className="px-6 py-3 border-b text-left">Role</th>
                <th className="px-6 py-3 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="px-6 py-4 border-b">
                    {user.profiles?.email || user.user_id}
                  </td>
                  <td className="px-6 py-4 border-b">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                      className="p-1 border rounded"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <button
                      onClick={() => removeUser(user.user_id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirm User Deletion</h2>
            <p className="mb-2">To delete this user permanently, type <span className="font-mono font-bold">delete</span> below and press confirm.</p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              className="w-full border p-2 rounded mb-4"
              placeholder="Type 'delete' to confirm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deleteInput !== 'delete'}
                className={`px-4 py-2 rounded text-white ${deleteInput === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}