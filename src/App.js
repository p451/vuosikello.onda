import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import SignUp from './components/SignUp';
import Navigation from './components/Navigation';
import AikajanaKalenteri from './components/AikajanaKalenteri';
import TenantAdminDashboard from './components/TenantAdminDashboard';
import { TenantProvider } from './contexts/TenantContext';
import { RoleProvider } from './contexts/RoleContext';
import './App.css';

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
          {session && <Navigation />}
          <div className="container">
            <Routes>
              <Route 
                path="/signup" 
                element={!session ? <SignUp /> : <Navigate to="/" />} 
              />
              <Route 
                path="/login" 
                element={!session ? <Auth /> : <Navigate to="/" />} 
              />
              <Route 
                path="/admin" 
                element={session ? <TenantAdminDashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={session ? <AikajanaKalenteri /> : <Navigate to="/login" />} 
              />
            </Routes>
          </div>
        </RoleProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;