import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTenantId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.tenant_id) {
        setTenantId(user.user_metadata.tenant_id);
      }
      setLoading(false);
    };

    getTenantId();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.user_metadata?.tenant_id) {
        setTenantId(session.user.user_metadata.tenant_id);
      } else {
        setTenantId(null);
      }
    });

    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const value = {
    tenantId,
    loading,
  };

  return (
    <TenantContext.Provider value={value}>
      {!loading && children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};