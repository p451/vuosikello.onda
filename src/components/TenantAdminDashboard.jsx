import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import { useRole } from '../contexts/RoleContext';

export default function TenantAdminDashboard({ darkMode, setDarkMode }) {
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const { tenantId } = useTenant();
  const { userRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [newEventType, setNewEventType] = useState('');
  const [newEventTypeColor, setNewEventTypeColor] = useState('#2196f3');
  const [showDeleteModal, setShowDeleteModal] = useState(false);  const [deleteInput, setDeleteInput] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  // Move fetchUsers to top-level so it's defined before useEffect and can be called anywhere
  const fetchUsers = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('*, profiles: user_id (email, name, last_name, first_name)')
      .eq('tenant_id', tenantId);
    if (!error && data) {      setUsers(data.map(u => ({
        ...u,
        email: u.profiles?.email || u.email || u.user_id, // fallback to user_id if no email
        name: u.profiles?.name || ((u.profiles?.first_name && u.profiles?.last_name) ? 
          `${u.profiles.first_name} ${u.profiles.last_name}` : 
          u.profiles?.first_name || u.profiles?.last_name || null)
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
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/create_user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54`
        },
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
    try {      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/delete_user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FtaXdwcm51anFramlobGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDU1NTEsImV4cCI6MjA2MjI4MTU1MX0.plhNaMEg8jiiNBvkMNPPbtsevM43ArGEXVe_TbVJE54`
        },
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

  // Change user role
  const changeUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background text-xl text-primary font-serif">Loading...</div>;

  return (
    <div className={`w-full min-h-screen p-2 sm:p-4 ${darkMode ? 'dark bg-darkBackground text-darkTextPrimary' : 'bg-background text-textPrimary'}`}>
      <div className="max-w-4xl mx-auto bg-surface/90 rounded-lg shadow-glass border border-border p-2 sm:p-4 md:p-8 backdrop-blur-sm dark:bg-darkSurface/90 dark:border-darkBorder dark:text-darkTextPrimary">
        <div className="flex justify-between items-center mb-4">
          <h1 className="admin-header text-2xl sm:text-3xl font-serif font-bold text-primary tracking-elegant dark:text-darkPrimary">Tenant Admin Dashboard</h1>
          <button
            className={`px-4 py-2 rounded-lg font-sans font-semibold shadow-soft border transition-all ml-2 ${darkMode ? 'bg-darkSurface text-darkTextPrimary border-darkBorder hover:bg-darkHighlight' : 'bg-surface text-textPrimary border-border hover:bg-highlight'}`}
            onClick={() => setDarkMode(dm => !dm)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
        <form onSubmit={addUserDirectly} className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-4 sm:mb-6">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="Invite user by email"
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-border bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
          />
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-border bg-white/80 backdrop-blur-sm text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 sm:px-6 sm:py-3 font-semibold shadow-soft hover:bg-primaryHover transition-all text-sm sm:text-base w-full sm:w-auto dark:bg-darkPrimary dark:text-darkTextPrimary dark:hover:bg-darkHighlight">Invite</button>
        </form>
        <div className="mb-6 sm:mb-8">
          <h2 className="admin-header text-lg sm:text-xl font-serif font-bold text-primary mb-2 sm:mb-4 tracking-elegant dark:text-darkPrimary">Event Types</h2>
          <form onSubmit={addEventType} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-2 items-center p-2 bg-surface/80 rounded-lg shadow-soft dark:bg-darkSurface/80">
            <input
              type="text"
              value={newEventType}
              onChange={e => setNewEventType(e.target.value)}
              placeholder="New event type"
              className="p-2 border border-border rounded-lg bg-white/80 backdrop-blur-sm placeholder:text-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all text-sm sm:text-base w-full sm:w-auto dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder dark:placeholder-darkTextSecondary"
            />
            <input
              type="color"
              value={newEventTypeColor}
              onChange={e => setNewEventTypeColor(e.target.value)}
              className="w-8 h-8 border border-border rounded-lg shadow-subtle hover:shadow-soft transition-all cursor-pointer dark:bg-darkSurface dark:border-darkBorder"
              title="Pick color"
            />
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-sans shadow-soft hover:shadow-softHover hover:bg-primaryHover transition-all border border-primary text-sm sm:text-base w-full sm:w-auto dark:bg-darkPrimary dark:text-darkTextPrimary dark:border-darkPrimary dark:hover:bg-darkHighlight">Add</button>
          </form>
          <ul>
            {eventTypes.map(type => (
              <li key={type.id} className="flex items-center justify-between p-2 hover:bg-secondary/20 rounded-lg transition-all text-sm sm:text-base">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md border border-border shadow-subtle" style={{ background: type.color || '#2196f3' }}></span>
                  <span className="text-textPrimary font-medium">{type.name}</span>
                </span>
                <button onClick={() => removeEventType(type.id)} className="text-error hover:text-error/80 font-serif tracking-elegant transition-all px-2 rounded-lg text-xs sm:text-base">Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div>          <h2 className="admin-header text-lg sm:text-xl font-serif font-bold text-primary mb-2 sm:mb-4 tracking-elegant">Current Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-surface/80 rounded-lg shadow-card border border-border text-xs sm:text-sm md:text-base">
              <thead>
                <tr>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 border-b border-border text-left">User</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 border-b border-border text-left">Role</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 border-b border-border text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} className="hover:bg-secondary/10 transition-all">
                    <td className="px-2 sm:px-4 py-2 text-textPrimary text-xs sm:text-sm">
                      {user.name ? (
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-textSecondary text-xs">{user.email || user.user_id}</div>
                        </div>
                      ) : (
                        user.email || user.user_id
                      )}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-border">
                      <select
                        value={user.role}
                        onChange={e => changeUserRole(user.user_id, e.target.value)}
                        className="p-1 border border-border rounded-md text-xs sm:text-sm dark:bg-darkSurface dark:text-darkTextPrimary dark:border-darkBorder"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 border-b border-border">
                      <button
                        className="px-2 sm:px-3 py-1 rounded-lg bg-error text-black font-medium shadow-card hover:bg-error/90 transition-all border border-error text-xs sm:text-xs md:text-sm"
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
          <div className="fixed inset-0 flex items-center justify-center bg-overlay bg-opacity-50 z-50 p-2">
            <div className="bg-surface p-4 sm:p-6 rounded-md shadow-glass max-w-xs sm:max-w-sm w-full">
              <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Confirm User Deletion</h2>
              <p className="mb-2 text-xs sm:text-base">To delete this user permanently, type <span className="font-mono font-bold">delete</span> below and press confirm.</p>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className="w-full border border-metal p-2 rounded-md mb-2 sm:mb-4 text-xs sm:text-base"
                placeholder="Type 'delete' to confirm"
              />
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-xs sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleteInput !== 'delete'}
                  className={`px-4 py-2 rounded-lg ${deleteInput === 'delete' ? 'bg-error text-black hover:bg-error/90' : 'bg-gray-400 text-white cursor-not-allowed'} text-xs sm:text-base`}
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