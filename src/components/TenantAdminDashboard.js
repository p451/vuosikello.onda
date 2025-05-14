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
  const [eventTypes, setEventTypes] = useState([]);
  const [newEventType, setNewEventType] = useState('');
  const [newEventTypeColor, setNewEventTypeColor] = useState('#2196f3');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  // Move fetchUsers to top-level so it's defined before useEffect and can be called anywhere
  const fetchUsers = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*, profiles: user_id (email)')
      .eq('tenant_id', tenantId);
    if (!error && data) {
      setUsers(data.map(u => ({
        ...u,
        email: u.profiles?.email || u.email || u.user_id // fallback to user_id if no email
      })));
    }
    setLoading(false);
  };

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
      setInviteEmail('');
      setSelectedRole('viewer');
      fetchUsers();
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (deleteInput !== 'delete' || !userToDelete) return;
    setLoading(true);
    try {
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/delete_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userToDelete })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Käyttäjän poisto epäonnistui');
      setUsers(prev => prev.filter(user => user.user_id !== userToDelete));
    } catch (error) {
      console.error(error.message);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
      setDeleteInput('');
      setLoading(false);
    }
  };

  // Add handleDeleteUser to open the delete modal and set user to delete
  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
    setDeleteInput('');
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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background text-xl text-primary font-serif">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto bg-surface/90 rounded-lg shadow-glass border border-border p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-serif font-bold text-primary mb-6 tracking-elegant">Tenant Admin Dashboard</h1>
        <form onSubmit={addUserDirectly} className="flex gap-2 mb-6">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="Invite user by email"
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all"
          />
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-4 py-3 rounded-lg border border-border bg-white/80 backdrop-blur-sm text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="bg-primary text-white rounded-lg px-6 py-3 font-semibold shadow-soft hover:bg-primaryHover transition-all">Invite</button>
        </form>
        <div className="mb-8">
          <h2 className="text-xl font-serif font-bold text-primary mb-4 tracking-elegant">Event Types</h2>
          <form onSubmit={addEventType} className="flex space-x-2 mb-2 items-center p-2 bg-surface/80 rounded-lg shadow-soft">
            <input
              type="text"
              value={newEventType}
              onChange={e => setNewEventType(e.target.value)}
              placeholder="New event type"
              className="p-2 border border-border rounded-lg bg-white/80 backdrop-blur-sm placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all"
            />
            <input
              type="color"
              value={newEventTypeColor}
              onChange={e => setNewEventTypeColor(e.target.value)}
              className="w-8 h-8 border border-border rounded-lg shadow-subtle hover:shadow-soft transition-all cursor-pointer"
              title="Pick color"
            />
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-serif tracking-elegant shadow-soft hover:shadow-softHover hover:bg-primaryHover transition-all border border-primary">Add</button>
          </form>
          <ul>
            {eventTypes.map(type => (
              <li key={type.id} className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-lg transition-all">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md border border-border shadow-subtle" style={{ background: type.color || '#2196f3' }}></span>
                  <span className="text-textPrimary font-medium">{type.name}</span>
                </span>
                <button onClick={() => removeEventType(type.id)} className="text-error hover:text-error/80 font-serif tracking-elegant transition-all px-2 rounded-lg">Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold text-primary mb-4 tracking-elegant">Current Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-surface/80 rounded-lg shadow-card border border-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b border-border text-left">Email</th>
                  <th className="px-6 py-3 border-b border-border text-left">Role</th>
                  <th className="px-6 py-3 border-b border-border text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-secondary/10 transition-all">
                    <td className="px-4 py-2 text-textPrimary text-sm">{user.email || user.user_id}</td>
                    <td className="px-6 py-4 border-b border-border">{user.role}</td>
                    <td className="px-6 py-4 border-b border-border">
                      <button
                        className="px-3 py-1 rounded-lg bg-error text-black font-medium shadow-card hover:bg-error/90 transition-all border border-error text-xs"
                        onClick={() => handleDeleteUser(user.user_id)}
                      >
                        Delete
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
          <div className="fixed inset-0 flex items-center justify-center bg-overlay bg-opacity-50 z-50">
            <div className="bg-surface p-6 rounded-md shadow-glass max-w-sm w-full">
              <h2 className="text-lg font-bold mb-4">Confirm User Deletion</h2>
              <p className="mb-2">To delete this user permanently, type <span className="font-mono font-bold">delete</span> below and press confirm.</p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full border border-metal p-2 rounded-md mb-4"
                placeholder="Type 'delete' to confirm"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleteInput !== 'delete'}
                  className={`px-4 py-2 rounded-lg ${deleteInput === 'delete' ? 'bg-error text-black hover:bg-error/90' : 'bg-gray-400 text-white cursor-not-allowed'}`}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}