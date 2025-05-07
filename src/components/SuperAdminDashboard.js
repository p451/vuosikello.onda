import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Set your superadmin email(s) here
const SUPERADMINS = ['antoni.duhov@outlook.com']; // <-- replace with your email

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600 font-bold">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Superadmin Dashboard</h1>
      <h2 className="text-xl font-semibold mb-4">Tenants</h2>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-6 py-3 border-b text-left">Tenant Name</th>
            <th className="px-6 py-3 border-b text-left">Created</th>
            <th className="px-6 py-3 border-b text-left">ID</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(tenant => (
            <tr key={tenant.id}>
              <td className="px-6 py-4 border-b">{tenant.name}</td>
              <td className="px-6 py-4 border-b">{tenant.created_at}</td>
              <td className="px-6 py-4 border-b">{tenant.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Add more superadmin tools here as needed */}
    </div>
  );
}
