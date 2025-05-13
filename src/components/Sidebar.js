import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRole } from "../contexts/RoleContext";
import { useState, useEffect } from "react";

const SUPERADMINS = ["antoni.duhov@gmail.com"];

const Sidebar = () => {
  const { userRole } = useRole();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      if (supabase && supabase.auth) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="h-full w-64 bg-gray-800 text-white flex flex-col justify-between fixed left-0 top-0 shadow-lg z-40">
      <div>
        <div className="p-6 text-2xl font-bold border-b border-gray-700">Vuosikello</div>
        <nav className="flex flex-col gap-2 p-4">
          {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
            <Link to="/admin" className="py-2 px-4 rounded hover:bg-gray-700 text-left">Admin dashboard</Link>
          )}
          <Link to="/" className="py-2 px-4 rounded hover:bg-gray-700 text-left">Calendar</Link>
          <div className="mt-4 mb-2 text-sm text-gray-400 uppercase">Näkymä</div>
          <button className="py-2 px-4 rounded hover:bg-gray-700 text-left">Päivä</button>
          <button className="py-2 px-4 rounded hover:bg-gray-700 text-left">Viikko</button>
          <button className="py-2 px-4 rounded hover:bg-gray-700 text-left">Kuukausi</button>
          <div className="mt-4" />
          <button className="py-2 px-4 rounded hover:bg-gray-700 text-left">Print Agenda</button>
          <button className="py-2 px-4 rounded hover:bg-gray-700 text-left">Print Calendar</button>
          <button onClick={handleLogout} className="py-2 px-4 rounded hover:bg-gray-700 text-left text-red-400 mt-4">Logout</button>
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <button className="w-full py-2 px-4 rounded hover:bg-gray-700 text-left">Oma profiili</button>
      </div>
    </div>
  );
};

export default Sidebar;
