import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import SignUp from './components/SignUp';
import AikajanaKalenteri from './components/AikajanaKalenteri';
import { TenantProvider } from './contexts/TenantContext';
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
              path="/" 
              element={session ? <AikajanaKalenteri /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </TenantProvider>
    </Router>
  );
}

export default App;