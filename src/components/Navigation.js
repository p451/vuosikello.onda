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
    <nav className="bg-[#F3F1EE] text-[#2D3E50] p-4 border-b border-[#DDD6CE]" style={{ fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: '1.6em' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Näytä tenantin nimi vain jos käyttäjä on kirjautunut */}
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold font-spectral-sc uppercase tracking-[0.5px]" style={{ fontFamily: 'Spectral SC, serif', fontVariant: 'small-caps', lineHeight: '1.3em', letterSpacing: '0.5px' }}>
            Aikumo
          </Link>
          {user && tenantName && (
            <span className="ml-2 text-base font-semibold text-[#8C2F39] bg-[#F8F6F3] px-2 py-1 rounded border border-[#8C2F39]" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>{tenantName}</span>
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
        <div className="hidden sm:flex space-x-4 items-center">
          {user && (
            <>
              <Link to="/" className="hover:text-[#8C2F39] px-3 py-1 rounded transition-all border-b-2 border-transparent hover:border-[#8C2F39] focus:border-[#8C2F39]">
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-[#8C2F39] px-3 py-1 rounded transition-all border-b-2 border-transparent hover:border-[#8C2F39] focus:border-[#8C2F39]">
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-[#8C2F39] px-3 py-1 rounded transition-all border-b-2 border-transparent hover:border-[#8C2F39] focus:border-[#8C2F39]">
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="ml-4 px-3 py-1 rounded bg-gradient-to-b from-[#8C2F39] to-[#7A2631] text-white font-semibold shadow-sm hover:shadow-lg transition-all border border-[#8C2F39]"
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden mt-2 bg-[#F8F6F3] rounded shadow p-2 flex flex-col gap-2 border border-[#DDD6CE]">
          {user && (
            <>
              <Link to="/" className="hover:text-[#8C2F39] px-3 py-1 rounded transition-all border-b-2 border-transparent hover:border-[#8C2F39] focus:border-[#8C2F39]" onClick={() => setMenuOpen(false)}>
                Calendar
              </Link>
              {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
                <Link to="/admin" className="hover:text-[#8C2F39] px-3 py-1 rounded transition-all border-b-2 border-transparent hover:border-[#8C2F39] focus:border-[#8C2F39]" onClick={() => setMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              {user && SUPERADMINS.includes(user.email) && (
                <Link to="/superadmin" className="hover:text-[#8C2F39] px-3 py-1 rounded transition-all border-b-2 border-transparent hover:border-[#8C2F39] focus:border-[#8C2F39]" onClick={() => setMenuOpen(false)}>
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-3 py-1 rounded bg-gradient-to-b from-[#8C2F39] to-[#7A2631] text-white font-semibold shadow-sm hover:shadow-lg transition-all border border-[#8C2F39] text-left"
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