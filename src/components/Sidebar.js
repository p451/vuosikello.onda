import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRole } from "../contexts/RoleContext";
import { useState, useEffect } from "react";
import { useTenant } from "../contexts/TenantContext";

const SUPERADMINS = ["antoni.duhov@gmail.com"];

const Sidebar = () => {
  const { userRole } = useRole();
  const { tenantId } = useTenant();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(true);
  const [tenantName, setTenantName] = useState("");
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

  useEffect(() => {
    const fetchTenantName = async () => {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", tenantId)
        .single();
      if (!error && data) setTenantName(data.name);
    };
    fetchTenantName();
  }, [tenantId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Hyödynnetään AikajanaKalenterin näkymätilan vaihtoa
  const handleViewChange = (mode) => {
    // Etsitään kalenterikomponentti ja kutsutaan sen setViewMode-funktiota
    const event = new CustomEvent('sidebar-set-viewmode', { detail: mode });
    window.dispatchEvent(event);
  };

  // Hyödynnetään AikajanaKalenterin print-funktioita
  const handlePrint = (type) => {
    const event = new CustomEvent('sidebar-print', { detail: type });
    window.dispatchEvent(event);
  };

  if (!open) {
    return (
      <button
        className="fixed top-4 left-4 z-50 bg-primary text-white rounded-full shadow-lg p-2 hover:bg-primaryDark transition"
        aria-label="Avaa valikko"
        onClick={() => setOpen(true)}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
    );
  }

  return (
    <aside className="h-full w-64 bg-surface text-textPrimary flex flex-col justify-between fixed left-0 top-0 shadow-lg z-40 font-sans transition-transform duration-300" style={{fontFamily: 'Inter, sans-serif'}}>
      <div>
        <div className="flex items-center justify-between p-6 text-2xl font-bold border-b border-border bg-surface">
          <span className="font-serif tracking-elegant" style={{fontFamily: 'Spectral SC, serif', fontVariant: 'small-caps'}}>{tenantName || ""}</span>
          <button
            className="ml-2 p-1 rounded hover:bg-secondary text-2xl text-primaryDark transition"
            aria-label="Sulje valikko"
            onClick={() => setOpen(false)}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
            <Link to="/admin" className="py-2 px-4 rounded hover:bg-secondary text-left font-medium transition">Admin dashboard</Link>
          )}
          <Link to="/" className="py-2 px-4 rounded hover:bg-secondary text-left font-medium transition">Calendar</Link>
          <div className="mt-4 mb-2 text-xs text-placeholder uppercase tracking-wider">Näkymä</div>
          <button className="py-2 px-4 rounded hover:bg-secondary text-left" onClick={() => handleViewChange('day')}>Päivä</button>
          <button className="py-2 px-4 rounded hover:bg-secondary text-left" onClick={() => handleViewChange('week')}>Viikko</button>
          <button className="py-2 px-4 rounded hover:bg-secondary text-left" onClick={() => handleViewChange('month')}>Kuukausi</button>
          <div className="mt-4" />
          <button className="py-2 px-4 rounded hover:bg-secondary text-left" onClick={() => handlePrint('agenda')}>Print Agenda</button>
          <button className="py-2 px-4 rounded hover:bg-secondary text-left" onClick={() => handlePrint('calendar')}>Print Calendar</button>
          <button onClick={handleLogout} className="py-2 px-4 rounded hover:bg-secondary text-left text-primary mt-4 font-semibold">Logout</button>
        </nav>
      </div>
      <div className="p-4 border-t border-border">
        <button className="w-full py-2 px-4 rounded hover:bg-secondary text-left font-medium">Oma profiili</button>
      </div>
    </aside>
  );
};

export default Sidebar;
