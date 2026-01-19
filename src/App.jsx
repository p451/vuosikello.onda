import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { TenantProvider } from './contexts/TenantContext';
import { RoleProvider } from './contexts/RoleContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { setGlobalToastFunction } from './lib/notificationUtils';
import './aikumo-teema.css';
// Lazy-loaded components for code splitting
const Auth = lazy(() => import('./components/Auth'));
const SignUp = lazy(() => import('./components/SignUp'));
const AikajanaKalenteri = lazy(() => import('./components/AikajanaKalenteri'));
const TenantAdminDashboard = lazy(() => import('./components/TenantAdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const Tasks = lazy(() => import('./components/Tasks'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const ActivateAccount = lazy(() => import('./components/ActivateAccount'));
const Sidebar = lazy(() => import('./components/Sidebar'));

// Komponentin joka alustaa globaalin toast-funktion
function AppToastInitializer({ children }) {
  const toast = useToast();
  
  useEffect(() => {
    // Aseta globaali toast-funktio notificationUtils:ille
    setGlobalToastFunction((message, type = 'info', duration = 5000) => {
      console.log('Toast called with:', message, type);
      if (toast && toast[type]) {
        toast[type](message, duration);
      }
    });
  }, [toast]);

  return children;
}

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
    <ErrorBoundary>
      <ToastProvider>
        <AppToastInitializer>
          <Router>
            <TenantProvider>
              <RoleProvider>
                <div className={`App min-h-screen font-sans text-textPrimary ${darkMode ? 'dark bg-darkBackground text-darkTextPrimary' : 'bg-background text-textPrimary'}`}>
                  {session && (
                    <Suspense fallback={<div>Loading sidebar...</div>}>
                      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} darkMode={darkMode} setDarkMode={setDarkMode} />
                    </Suspense>
                  )}
                  <main className={`pt-4 pb-8 ${session ? 'px-0 sm:px-8' : 'px-2 sm:px-8'} sm:max-w-7xl sm:mx-auto`}>
                    <Suspense fallback={<div>Loading page...</div>}>
                      <Routes>
                        <Route path="/" element={session ? <AikajanaKalenteri sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> : <Navigate to="/login" />} />
                        <Route path="/login" element={<Auth />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/admin" element={<TenantAdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />} />
                        <Route path="/superadmin" element={<SuperAdminDashboard />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/activate" element={<ActivateAccount />} />
                        <Route path="/tasks" element={session ? <Tasks /> : <Navigate to="/login" />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </RoleProvider>
            </TenantProvider>
          </Router>
        </AppToastInitializer>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;