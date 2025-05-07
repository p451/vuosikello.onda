import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { supabase } from '../supabaseClient';
import { useState, useEffect } from 'react';

const SUPERADMINS = ['antoni.duhov@outlook.com']; // <-- replace with your email

export default function Navigation() {
  const { userRole } = useRole();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Vuosikello
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-gray-300">
            Calendar
          </Link>
          {userRole === 'admin' && (
            <Link to="/admin" className="hover:text-gray-300">
              Admin Dashboard
            </Link>
          )}
          {user && SUPERADMINS.includes(user.email) && (
            <Link to="/superadmin" className="hover:text-gray-300">
              Superadmin Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}