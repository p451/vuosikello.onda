import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { supabase } from '../supabaseClient';
import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';

const SUPERADMINS = ['antoni.duhov@gmail.com']; // <-- replace with your email

export default function Navigation() {
  const { userRole } = useRole();
  const { tenantId } = useTenant();
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchTenantName = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single();
      if (!error && data) setTenantName(data.name);
    };
    fetchTenantName();
  }, [tenantId]);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Näytä tenantin nimi vain jos käyttäjä on kirjautunut */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold">
            Vuosikello
          </Link>
          {user && tenantName && (
            <span className="ml-2 text-base font-semibold text-blue-200">{tenantName}</span>
          )}
        </div>
        <div className="sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none"
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Näytä valikkolinkit vain jos käyttäjä on kirjautunut */}
        <div className="hidden sm:flex space-x-4 items-center">
          {user && (
            <>
              <Link to="/" className="hover:text-gray-300">
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-gray-300">
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-gray-300">
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="ml-4 px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-2 bg-gray-700 rounded shadow p-2 flex flex-col gap-2">
          {user && (
            <>
              <Link to="/" className="hover:text-gray-300" onClick={() => setMenuOpen(false)}>
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-gray-300" onClick={() => setMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-gray-300" onClick={() => setMenuOpen(false)}>
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-white text-left"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}