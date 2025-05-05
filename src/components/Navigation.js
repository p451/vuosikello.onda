import React from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';

export default function Navigation() {
  const { userRole } = useRole();

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
        </div>
      </div>
    </nav>
  );
}