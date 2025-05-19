import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import SignUp from './components/SignUp';
import AikajanaKalenteri from './components/AikajanaKalenteri';
import TenantAdminDashboard from './components/TenantAdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ResetPassword from './components/ResetPassword';
import ActivateAccount from './components/ActivateAccount';
import Sidebar from './components/Sidebar';
import { TenantProvider } from './contexts/TenantContext';
import { RoleProvider } from './contexts/RoleContext';
import './App.css';
import './aikumo-teema.css';

function App() {
  const [session, setSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    // Try to load from localStorage or use prefers-color-scheme
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aikumo-darkmode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aikumo-darkmode', darkMode);
  }, [darkMode]);

  // Redirect to calendar if logged in and on login/signup page
  useEffect(() => {
    if (session && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
      window.location.replace('/');
    }
  }, [session]);

  return (
    <Router>
      <TenantProvider>
        <RoleProvider>
          <div className={`App min-h-screen font-sans text-textPrimary ${darkMode ? 'dark bg-darkBackground text-darkTextPrimary' : 'bg-background text-textPrimary'}`}>
            {session && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} darkMode={darkMode} setDarkMode={setDarkMode} />}
            <main className={`pt-4 pb-8 ${session ? 'px-0 sm:px-8' : 'px-2 sm:px-8'} sm:max-w-7xl sm:mx-auto`}>
              <Routes>
                <Route path="/" element={session ? <AikajanaKalenteri sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/admin" element={<TenantAdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
                <Route path="/superadmin" element={<SuperAdminDashboard />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/activate" element={<ActivateAccount />} />
              </Routes>
            </main>
          </div>
        </RoleProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;