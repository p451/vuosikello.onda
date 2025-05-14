import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import SignUp from './components/SignUp';
import Navigation from './components/Navigation';
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

  return (
    <Router>
      <TenantProvider>
        <RoleProvider>
          <div className="App min-h-screen bg-background font-sans text-textPrimary">
            {session && <Sidebar />}
            {session && <Navigation />}
            <main className="pt-4 pb-8 px-2 sm:px-8">
              <Routes>
                <Route path="/" element={session ? <AikajanaKalenteri /> : <Navigate to="/login" />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/admin" element={<TenantAdminDashboard />} />
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