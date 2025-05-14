import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

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

  // Helper for nav highlighting
  const isActive = (path) => location.pathname === path;
  // Helper for view mode highlighting
  const [viewMode, setViewMode] = useState('month');
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'day' || e.detail === 'week' || e.detail === 'month') {
        setViewMode(e.detail);
      }
    };
    window.addEventListener('sidebar-set-viewmode', handler);
    return () => window.removeEventListener('sidebar-set-viewmode', handler);
  }, []);

  // Sidebar closed state: hide sidebar fully, show open icon at bottom left with animation
  if (!open) {
    return (
      <div className="fixed bottom-4 left-2 z-50 sm:bottom-8 sm:left-4">
        <button
          className="rounded-full bg-surface shadow-card border border-accent p-2 sm:p-3 flex items-center justify-center transition-all duration-700 ease-in-out hover:scale-110"
          onClick={() => setOpen(true)}
          aria-label="Avaa sivupalkki"
        >
          {/* Arrow icon for opening sidebar */}
          <svg width="24" height="24" stroke="#2E2E2E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="h-full w-5/6 max-w-xs sm:w-64 bg-surface/95 text-textPrimary flex flex-col justify-between fixed left-0 top-0 shadow-card z-40 font-sans transition-all duration-500 ease-in-out border-r border-accent rounded-lg animate-sidebar-open">
      <div>
        <div className="flex items-center justify-between p-3 sm:p-4 text-lg sm:text-xl font-semibold border-b border-accent bg-surface/95 rounded-t-lg">
          <span className="font-sans font-semibold text-[16px] sm:text-[18px]">{tenantName || ""}</span>
          <button
            className="ml-2 p-2 rounded-lg hover:bg-primary/20 transition-all duration-150 flex items-center"
            aria-label="Sulje sivupalkki"
            onClick={() => setOpen(false)}
          >
            {/* ChatGPT-style close icon */}
            <svg width="20" height="20" stroke="#2E2E2E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6L18 18M6 18L18 6" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1 sm:gap-2 p-2 sm:p-4">
          {(userRole === 'admin' || (user && SUPERADMINS.includes(user.email))) && (
            <Link to="/admin"
              className={`py-2 px-3 sm:px-4 rounded-lg font-sans font-medium text-[13px] sm:text-[14px] border transition-all text-left shadow-card
                ${isActive('/admin') ? 'bg-primary text-textPrimary border-primary' : 'bg-surface text-textPrimary border-transparent hover:bg-highlight'}`}
            >Admin dashboard</Link>
          )}
          <Link to="/"
            className={`py-2 px-3 sm:px-4 rounded-lg font-sans font-medium text-[13px] sm:text-[14px] border transition-all text-left shadow-card
              ${isActive('/') ? 'bg-primary text-textPrimary border-primary' : 'bg-surface text-textPrimary border-transparent hover:bg-highlight'}`}
          >Calendar</Link>
          <div className="mt-2 sm:mt-4 mb-1 sm:mb-2 text-xs text-textSecondary uppercase tracking-wide">Näkymä</div>
          <button
            className={`py-2 px-3 sm:px-4 rounded-lg font-sans font-medium text-[13px] sm:text-[14px] border transition-all text-left shadow-card
              ${viewMode === 'day' ? 'bg-primary text-textPrimary border-primary' : 'bg-surface text-textPrimary border-transparent hover:bg-highlight'}`}
            onClick={() => handleViewChange('day')}
          >Päivä</button>
          <button
            className={`py-2 px-3 sm:px-4 rounded-lg font-sans font-medium text-[13px] sm:text-[14px] border transition-all text-left shadow-card
              ${viewMode === 'week' ? 'bg-primary text-textPrimary border-primary' : 'bg-surface text-textPrimary border-transparent hover:bg-highlight'}`}
            onClick={() => handleViewChange('week')}
          >Viikko</button>
          <button
            className={`py-2 px-3 sm:px-4 rounded-lg font-sans font-medium text-[13px] sm:text-[14px] border transition-all text-left shadow-card
              ${viewMode === 'month' ? 'bg-primary text-textPrimary border-primary' : 'bg-surface text-textPrimary border-transparent hover:bg-highlight'}`}
            onClick={() => handleViewChange('month')}
          >Kuukausi</button>
          <div className="mt-2 sm:mt-4" />
          <button className="py-2 px-3 sm:px-4 rounded-lg bg-surface text-textPrimary font-sans font-medium text-[13px] sm:text-[14px] border border-secondary hover:bg-highlight shadow-card transition-all text-left" onClick={handlePrintAgenda}>Print Agenda</button>
          <button className="py-2 px-3 sm:px-4 rounded-lg bg-surface text-textPrimary font-sans font-medium text-[13px] sm:text-[14px] border border-accent hover:bg-highlight shadow-card transition-all text-left" onClick={() => handlePrint('calendar')}>Print Calendar</button>
          <button onClick={handleLogout} className="py-2 px-3 sm:px-4 rounded-lg bg-error text-black font-sans font-medium text-[13px] sm:text-[14px] hover:bg-error/90 shadow-card transition-all text-left mt-2 sm:mt-4 border border-error">Logout</button>
        </nav>
      </div>
      <div className="p-2 sm:p-4 border-t border-accent bg-surface/95 rounded-b-lg">
        <button className="w-full py-2 px-3 sm:px-4 rounded-lg bg-surface text-textPrimary font-sans font-medium text-[13px] sm:text-[14px] border border-primary hover:bg-highlight shadow-card transition-all text-left">Oma profiili</button>
      </div>
    </aside>
  );
};

export default Sidebar;
