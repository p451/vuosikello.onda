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

  // Hyödynnetään AikajanaKalenterin printAgenda-funktion logiikkaa suoraan sidebarissa
  const handlePrintAgenda = () => {
    // Kopioitu printAgenda-funktio suoraan tähän
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    // Haetaan nykyinen näkymätila ja aikaväli
    const viewTitle = {
      day: 'päivän',
      week: 'viikon',
      month: 'kuukauden'
    }[window.__vuosikello_viewMode || 'month'];
    const currentDate = window.__vuosikello_currentDate ? new Date(window.__vuosikello_currentDate) : new Date();
    const getViewDateRange = () => {
      switch (window.__vuosikello_viewMode) {
        case 'day':
          return {
            start: new Date(currentDate.setHours(0, 0, 0, 0)),
            end: new Date(currentDate.setHours(23, 59, 59, 999))
          };
        case 'week': {
          const start = new Date(currentDate);
          start.setDate(currentDate.getDate() - currentDate.getDay() + 1);
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          return { start, end };
        }
        case 'month': {
          const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          return { start, end };
        }
        default:
          return {
            start: new Date(currentDate.setHours(0, 0, 0, 0)),
            end: new Date(currentDate.setHours(23, 59, 59, 999))
          };
      }
    };
    const { start, end } = getViewDateRange();
    const events = window.__vuosikello_events || {};
    const eventTypeMap = window.__vuosikello_eventTypeMap || {};
    const getEventTypeName = (type) => type;
    const parseLocalDate = (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    printWindow.document.write(`
      <html>
        <head>
          <title>Vuosikello - ${viewTitle} agenda</title>
          <style>
            body { font-family: Arial, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .event-type { margin-top: 2em; }
            .event-list { margin-left: 2em; }
            .event-item { padding: 0.5em; margin: 0.5em 0; border-radius: 4px; color: black; }
            @media print { @page { margin: 1cm; } .event-item { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
          </style>
        </head>
        <body class="agenda-print">
          <h1>Vuosikello - ${currentDate.toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })} ${viewTitle} tapahtumat</h1>
          ${Object.keys(events).map(type => `
            <div class="event-type">
              <h2>${getEventTypeName(type)}</h2>
              <div class="event-list">
                ${Object.values(events)
                  .flat()
                  .filter(event => {
                    const eventStart = parseLocalDate(event.startDate);
                    const eventEnd = parseLocalDate(event.endDate);
                    return event.type === type && eventStart <= end && eventEnd >= start;
                  })
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .map(event => `
                    <div class="event-item" style="background-color: ${eventTypeMap[type] || '#e2e8f0'}">
                      <strong>${event.name}</strong><br>
                      ${new Date(event.startDate).toLocaleDateString('fi-FI')} - 
                      ${new Date(event.endDate).toLocaleDateString('fi-FI')}
                    </div>
                  `).join('')}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!open) {
    return (      <div className="fixed top-0 left-0 h-full z-50 flex flex-col items-center justify-between bg-primary/80 hover:bg-primary shadow-glass hover:shadow-softHover transition-all duration-300 w-4 group cursor-pointer border-r border-metal"
        onClick={() => setOpen(true)}
        aria-label="Avaa sivupalkki"
        style={{ minWidth: '1rem', maxWidth: '1.5rem' }}
      >
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <span className="block text-white text-xs rotate-90 group-hover:scale-110 transition-all select-none font-serif tracking-elegant">Avaa sidebar</span>
        </div>
        <div className="mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </div>
      </div>
    );
  }

  return (
    <aside className={`h-full w-64 bg-surface text-textPrimary flex flex-col justify-between fixed left-0 top-0 shadow-soft z-40 font-sans transition-transform duration-300`}>
      <div>
        <div className="flex items-center justify-between p-6 text-2xl font-bold border-b border-metal bg-surface">
          <span className="font-serif tracking-elegant" style={{fontVariant: 'small-caps'}}>{tenantName || ""}</span>
          <button
            className="ml-2 px-3 py-1 rounded-md bg-secondary text-textPrimary font-serif font-semibold hover:bg-primary hover:text-white transition flex items-center gap-2 border border-metal"
            aria-label="Siirrä sidebar sivuun"
            onClick={() => setOpen(false)}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#23211A"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
            <span className="text-sm font-serif font-medium">Siirrä sivuun</span>
          </button>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
            <Link to="/admin" className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover transition">Admin dashboard</Link>
          )}
          <Link to="/" className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover transition">Calendar</Link>
          <div className="mt-4 mb-2 text-xs text-placeholder uppercase tracking-wider">Näkymä</div>          <button className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover shadow-soft hover:shadow-softHover transition-all text-left tracking-elegant border border-primary" onClick={() => handleViewChange('day')}>Päivä</button>
          <button className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover shadow-soft hover:shadow-softHover transition-all text-left tracking-elegant border border-primary" onClick={() => handleViewChange('week')}>Viikko</button>
          <button className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover shadow-soft hover:shadow-softHover transition-all text-left tracking-elegant border border-primary" onClick={() => handleViewChange('month')}>Kuukausi</button>
          <div className="mt-4" />
          <button className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover shadow-soft hover:shadow-softHover transition-all text-left tracking-elegant border border-primary" onClick={() => handlePrintAgenda()}>Print Agenda</button>
          <button className="py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover shadow-soft hover:shadow-softHover transition-all text-left tracking-elegant border border-primary" onClick={() => handlePrint('calendar')}>Print Calendar</button>
          <button onClick={handleLogout} className="py-2 px-4 rounded-md bg-error text-white font-serif font-semibold hover:bg-error/90 shadow-soft hover:shadow-softHover transition-all text-left tracking-elegant mt-4 border border-error">Logout</button>
        </nav>
      </div>
      <div className="p-4 border-t border-metal">
        <button className="w-full py-2 px-4 rounded-md bg-primary text-white font-serif font-semibold hover:bg-primaryHover transition text-left">Oma profiili</button>
      </div>
    </aside>
  );
};

export default Sidebar;
