import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Set your superadmin email(s) here
const SUPERADMINS = ['antoni.duhov@gmail.com']; // <-- updated to your email

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [newTenantName, setNewTenantName] = useState('');
  const [manageUsers, setManageUsers] = useState([]);
  const [manageEventTypes, setManageEventTypes] = useState([]);
  const [newEventType, setNewEventType] = useState('');
  const [newEventTypeColor, setNewEventTypeColor] = useState('#2196f3');
  const [editTenantName, setEditTenantName] = useState('');
  const [userInviteEmail, setUserInviteEmail] = useState('');
  const [userInviteRole, setUserInviteRole] = useState('viewer');

  useEffect(() => {
    const checkSuperadmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !SUPERADMINS.includes(user.email)) {
        setError('Access denied: You are not a superadmin.');
        setLoading(false);
        return;
      }
      fetchTenants();
    };
    checkSuperadmin();
  }, []);

  const fetchTenants = async () => {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) setError(error.message);
    else setTenants(data);
    setLoading(false);
  };

  // Add tenant
  const addTenant = async (e) => {
    e.preventDefault();
    if (!newTenantName) return;
    const { error } = await supabase
      .from('tenants')
      .insert([{ name: newTenantName }]);
    if (!error) {
      setNewTenantName('');
      fetchTenants();
    }
  };

  // Delete tenant
  const deleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This cannot be undone.')) return;
    await supabase.from('tenants').delete().eq('id', tenantId);
    fetchTenants();
  };

  // Open manage modal
  const openManageModal = async (tenant) => {
    setSelectedTenant(tenant);
    // Fetch users
    const { data: users } = await supabase
      .from('user_roles')
      .select('user_id,role,profiles(email)')
      .eq('tenant_id', tenant.id);
    setManageUsers(users || []);
    // Fetch event types
    const { data: eventTypes } = await supabase
      .from('tenant_event_types')
      .select('*')
      .eq('tenant_id', tenant.id);
    setManageEventTypes(eventTypes || []);
    setShowManageModal(true);
  };

  // Remove user from tenant
  const removeUser = async (userId) => {
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('tenant_id', selectedTenant.id);
    openManageModal(selectedTenant);
  };

  // Add event type
  const addEventType = async (e) => {
    e.preventDefault();
    if (!newEventType) return;
    await supabase.from('tenant_event_types').insert([
      { tenant_id: selectedTenant.id, name: newEventType, color: newEventTypeColor }
    ]);
    setNewEventType('');
    setNewEventTypeColor('#2196f3');
    openManageModal(selectedTenant);
  };

  // Remove event type
  const removeEventType = async (id) => {
    await supabase.from('tenant_event_types').delete().eq('id', id);
    openManageModal(selectedTenant);
  };

  // Edit tenant name
  const saveTenantName = async () => {
    if (!selectedTenant || !editTenantName) return;
    await supabase.from('tenants').update({ name: editTenantName }).eq('id', selectedTenant.id);
    fetchTenants();
    setSelectedTenant({ ...selectedTenant, name: editTenantName });
  };

  // Invite/create user for tenant (TenantAdminDashboard-tyyli)
  const inviteUser = async (e) => {
    e.preventDefault();
    if (!userInviteEmail) return;
    try {
      // Odota hetki, että profiili ehtii syntyä ennen user_roles-inserttiä
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const response = await fetch('https://kwgqmiwprnujqkjihllg.supabase.co/functions/v1/create_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInviteEmail,
          role: userInviteRole,
          tenant_id: selectedTenant.id
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Käyttäjän luonti epäonnistui');
      setUserInviteEmail('');
      setUserInviteRole('viewer');
      openManageModal(selectedTenant);
      alert('Käyttäjä lisätty ja kutsu lähetetty!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Change user role
  const changeUserRole = async (userId, newRole) => {
    await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId).eq('tenant_id', selectedTenant.id);
    openManageModal(selectedTenant);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background text-xl text-primary font-serif">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen bg-background text-xl text-error font-serif">{error}</div>;

  return (
    <div className="w-full min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto bg-surface/90 rounded-lg shadow-glass border border-border p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-serif font-bold text-primary mb-6 tracking-elegant">SuperAdmin Dashboard</h1>
        <form onSubmit={addTenant} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)}
            placeholder="New tenant name"
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all"
          />
          <button type="submit" className="bg-primary text-white rounded-full px-6 py-3 font-semibold shadow-soft hover:bg-primaryHover transition-all">Add Tenant</button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenants.map(tenant => (
            <div key={tenant.id} className="bg-surface rounded-lg shadow-card border border-border p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-serif font-bold text-primary">{tenant.name}</span>
                <button onClick={() => deleteTenant(tenant.id)} className="bg-error text-white rounded-full px-4 py-2 font-semibold shadow-soft hover:bg-error/90 transition-all">Delete</button>
              </div>
              <button onClick={() => { setSelectedTenant(tenant); setShowManageModal(true); }} className="bg-secondary text-textPrimary rounded-full px-4 py-2 font-semibold shadow-soft hover:bg-accent transition-all">Manage</button>
            </div>
          ))}
        </div>
        {/* Manage Tenant Modal */}
        {showManageModal && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface/90 p-6 rounded-lg w-full max-w-2xl relative shadow-glass border border-border backdrop-blur-sm">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setShowManageModal(false)}>&times;</button>
              <h2 className="text-xl font-bold mb-4">Manage Tenant: {selectedTenant.name}</h2>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={editTenantName === '' ? selectedTenant.name : editTenantName}
                  onChange={e => setEditTenantName(e.target.value)}
                  className="p-2 border rounded-md"
                />
                <button onClick={saveTenantName} className="px-3 py-1 bg-blue-500 text-white rounded-md">Save</button>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Invite/Create User</h3>
                <form onSubmit={inviteUser} className="flex gap-2 items-center mb-2">
                  <input
                    type="email"
                    value={userInviteEmail}
                    onChange={e => setUserInviteEmail(e.target.value)}
                    placeholder="User email"
                    className="p-2 border rounded-md"
                    required
                  />
                  <select
                    value={userInviteRole}
                    onChange={e => setUserInviteRole(e.target.value)}
                    className="p-2 border rounded-md"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded-md">Invite</button>
                </form>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Users</h3>
                <ul>
                  {manageUsers.map(user => (
                    <li key={user.user_id} className="flex items-center justify-between mb-1">
                      <span>{user.profiles?.email || user.user_id}</span>
                      <span className="flex items-center gap-2">
                        <select
                          value={user.role}
                          onChange={e => changeUserRole(user.user_id, e.target.value)}
                          className="p-1 border rounded-md"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => removeUser(user.user_id)} className="text-red-500 ml-2">Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Event Types</h3>
                <form onSubmit={addEventType} className="flex space-x-2 mb-2 items-center">
                  <input
                    type="text"
                    value={newEventType}
                    onChange={e => setNewEventType(e.target.value)}
                    placeholder="New event type"
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="color"
                    value={newEventTypeColor}
                    onChange={e => setNewEventTypeColor(e.target.value)}
                    className="w-8 h-8 border rounded-md"
                    title="Pick color"
                  />
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md">Add</button>
                </form>
                <ul>
                  {manageEventTypes.map(type => (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
