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
      if (!tenantId || !user) return;
      try {
        const { data, error, status } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', tenantId)
          .single();
        if (!error && data) setTenantName(data.name);
        else if (status === 406) setTenantName(''); // Gracefully handle 406 (unauthenticated)
      } catch (err) {
        setTenantName(''); // Fallback: clear tenant name on error
      }
    };
    fetchTenantName();
  }, [tenantId, user]);

  return (
    <nav className="bg-background text-textPrimary p-4 border-b border-metal font-sans" >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Show tenant name only if user is logged in */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-h1 font-semibold uppercase tracking-wide select-none transition-all duration-200 ease-in-out">
            Aikumo
          </Link>
          {user && tenantName && (
            <span className="ml-2 text-base font-medium text-primary bg-surface px-2 py-1 rounded-lg border border-primary transition-all duration-200 ease-in-out">{tenantName}</span>
          )}
        </div>
        <div className="sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none text-primary transition-all duration-200 ease-in-out"
            aria-label="Open menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Show menu links only if user is logged in */}
        <div className="hidden sm:flex space-x-4 items-center">
          {user && (
            <>
              <Link to="/" className="hover:text-primary font-medium px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5 text-button">
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-primary font-medium px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5 text-button">
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-primary font-medium px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5 text-button">
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="ml-4 px-3 py-1 rounded-lg bg-error text-black font-medium shadow-card hover:shadow-modal transition-all duration-200 ease-in-out border border-error text-button"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-2 bg-surface rounded-lg shadow-card p-2 flex flex-col gap-2 border border-metal transition-all duration-200 ease-in-out">
          {user && (
            <>
              <Link to="/" className="hover:text-primary px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary text-button" onClick={() => setMenuOpen(false)}>
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-primary px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary text-button" onClick={() => setMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-primary px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary text-button" onClick={() => setMenuOpen(false)}>
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-3 py-1 rounded-lg bg-error text-white font-medium shadow-card hover:shadow-modal transition-all duration-200 ease-in-out border border-error text-button"
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