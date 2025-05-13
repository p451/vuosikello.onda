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
    <nav className="bg-sakura text-textPrimary p-4 border-b border-metal" style={{ fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: '1.6em' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Näytä tenantin nimi vain jos käyttäjä on kirjautunut */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold font-spectral-sc uppercase tracking-[0.5px]" style={{ fontFamily: 'Spectral SC, serif', fontVariant: 'small-caps', lineHeight: '1.3em', letterSpacing: '0.5px' }}>
            Aikumo
          </Link>
          {user && tenantName && (
            <span className="ml-2 text-base font-semibold text-primary bg-surface px-2 py-1 rounded-md border border-primary" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{tenantName}</span>
          )}
        </div>
        <div className="sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none"
            aria-label="Open menu"
            style={{ color: '#4A4A4A' }}
          >
            <svg className="w-7 h-7" fill="none" stroke="#4A4A4A" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Näytä valikkolinkit vain jos käyttäjä on kirjautunut */}
        <div className="hidden sm:flex space-x-4 items-center">          {user && (
            <>
              <Link to="/" className="hover:text-primary font-serif tracking-elegant px-3 py-1 rounded-md transition-all border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5">
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-primary font-serif tracking-elegant px-3 py-1 rounded-md transition-all border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5">
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-primary font-serif tracking-elegant px-3 py-1 rounded-md transition-all border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5">
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="ml-4 px-3 py-1 rounded-md bg-error text-white font-serif font-semibold tracking-elegant shadow-soft hover:shadow-softHover transition-all border border-error hover:bg-error/90"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-2 bg-surface rounded-md shadow-soft p-2 flex flex-col gap-2 border border-metal">
          {user && (
            <>
              <Link to="/" className="hover:text-primary px-3 py-1 rounded-md transition-all border-b-2 border-transparent hover:border-primary focus:border-primary" onClick={() => setMenuOpen(false)}>
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-primary px-3 py-1 rounded-md transition-all border-b-2 border-transparent hover:border-primary focus:border-primary" onClick={() => setMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-primary px-3 py-1 rounded-md transition-all border-b-2 border-transparent hover:border-primary focus:border-primary" onClick={() => setMenuOpen(false)}>
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-3 py-1 rounded-md bg-gradient-to-b from-primary to-primaryHover text-white font-semibold shadow-soft hover:shadow-glass transition-all border border-primary text-left"
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
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