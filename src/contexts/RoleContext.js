import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useTenant } from './TenantContext';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useTenant();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!tenantId) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('tenant_id', tenantId)
          .single();

        if (!error && roleData) {
          setUserRole(roleData.role);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [tenantId]);

  const can = (action) => {
    switch (action) {
      case 'create':
      case 'update':
      case 'delete':
        return userRole === 'admin' || userRole === 'editor';
      case 'view':
        return true; // All roles can view
      default:
        return false;
    }
  };

  return (
    <RoleContext.Provider value={{ userRole, loading, can }}>
      {!loading && children}
    </RoleContext.Provider>
  );
}

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};