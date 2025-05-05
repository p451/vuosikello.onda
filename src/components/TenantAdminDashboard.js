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

  useEffect(() => {
    if (userRole !== 'admin') {
      window.location.href = '/';
      return;
    }
    fetchUsers();
  }, [tenantId, userRole]);

  const fetchUsers = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('id,role,user_id,tenant_id')
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

  const inviteUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // TODO: User creation should be handled in a secure backend/serverless function.
      setMessage('User invitation is not available from the frontend. Please implement this in a secure backend function.');
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
    if (!window.confirm('Are you sure you want to remove this user?')) return;

    // Optimistically update UI
    setUsers(prev => prev.filter(user => user.user_id !== userId));
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      setMessage('User removed successfully');
      // Optionally refetch users here if you want to be 100% sure
      // await fetchUsers();
    } catch (error) {
      setMessage(error.message);
      // Rollback UI if needed
      await fetchUsers();
    } finally {
      setLoading(false);
    }
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
        <form onSubmit={inviteUser} className="space-y-4">
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
            Send Invitation
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Current Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b text-left">User ID</th>
                <th className="px-6 py-3 border-b text-left">Role</th>
                <th className="px-6 py-3 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="px-6 py-4 border-b">
                    {user.user_id}
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
    </div>
  );
}