import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { supabase } from '../supabaseClient';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const { userRole, isSuperadmin } = useRole();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <nav className="bg-background text-textPrimary p-2 sm:p-4 border-b border-metal font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        {/* Centered AIKUMO header */}
        <div className="flex items-center gap-2 w-full justify-center">
          <Link to="/" className="text-xl sm:text-h1 font-semibold uppercase tracking-wide select-none transition-all duration-200 ease-in-out">
            Aikumo
          </Link>
          <div className="sm:hidden ml-auto">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="focus:outline-none text-primary transition-all duration-200 ease-in-out"
              aria-label="Open menu"
            >
              {/* Arrow icon for sidebar/menu */}
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        {/* Show menu links only if user is logged in */}
        <div className="hidden sm:flex space-x-2 sm:space-x-4 items-center w-full sm:w-auto justify-end">
          {user && (
            <>
              <Link to="/" className="hover:text-primary font-medium px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5 text-xs sm:text-button">
                Calendar
              </Link>
              {(userRole === 'admin' || isSuperadmin) && (
                <Link to="/admin" className="hover:text-primary font-medium px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5 text-xs sm:text-button">
                  Admin Dashboard
                </Link>
              )}
              {isSuperadmin && (
                <Link to="/superadmin" className="hover:text-primary font-medium px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary hover:bg-primary/5 text-xs sm:text-button">
                  Superadmin Dashboard
                </Link>
              )}
              <button
                className="logout-btn ml-2 sm:ml-4 px-2 sm:px-3 py-1 rounded-lg bg-error text-black font-sans font-medium shadow-card hover:shadow-modal transition-all duration-200 ease-in-out border border-error text-xs sm:text-button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
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
              <Link to="/" className="hover:text-primary px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary text-xs" onClick={() => setMenuOpen(false)}>
                Calendar
              </Link>
              {(userRole === 'admin' || isSuperadmin) && (
                <Link to="/admin" className="hover:text-primary px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary text-xs" onClick={() => setMenuOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              {isSuperadmin && (
                <Link to="/superadmin" className="hover:text-primary px-3 py-1 rounded-lg transition-all duration-200 ease-in-out border-b-2 border-transparent hover:border-primary focus:border-primary text-xs" onClick={() => setMenuOpen(false)}>
                  Superadmin Dashboard
                </Link>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-3 py-1 rounded-lg bg-error text-white font-medium shadow-card hover:shadow-modal transition-all duration-200 ease-in-out border border-error text-xs"
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