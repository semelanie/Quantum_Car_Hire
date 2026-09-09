import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useVehicles } from '../context/VehiclesContext';
import VehicleEditor from './VehicleEditor';
import BookingsCalendar from './BookingsCalendar';
import DriversManager from './DriversManager';
import ServiceCalendar from './ServiceCalendar';
import { fetchServiceEvents } from './serviceEventsApi';
import { exportVehiclesAsJson, exportVehiclesAsTs } from './exportData';
import { ADMIN_SESSION_KEY } from './config';
import type { ServiceEvent } from '../types/serviceEvent';

type AdminTab = 'fleet' | 'bookings' | 'drivers' | 'service';

interface AdminPanelProps {
  onLogout: () => void;
}

function formatSavedTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const { vehicles, resetAll, saveStatus, lastSavedAt } = useVehicles();
  const [exporting, setExporting] = useState<'json' | 'ts' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('fleet');
  const [activeServiceEvents, setActiveServiceEvents] = useState<ServiceEvent[]>([]);

  useEffect(() => {
    fetchServiceEvents({ activeOnly: true })
      .then(({ events }) => setActiveServiceEvents(events))
      .catch(() => {
        // Non-fatal: the Fleet tab just won't show "in service" badges.
      });
  }, [tab]);

  function handleLogout() {
    try {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
    onLogout();
  }

  function handleResetAll() {
    if (window.confirm('Reset every vehicle back to its original rates, details and photo? This clears all admin changes.')) {
      resetAll();
    }
  }

  async function handleExport(format: 'json' | 'ts') {
    setExportError(null);
    setExporting(format);
    try {
      if (format === 'json') await exportVehiclesAsJson(vehicles);
      else await exportVehiclesAsTs(vehicles);
    } catch {
      setExportError("Couldn't build the export file — try again.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="admin-panel">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div>
            <span className="eyebrow">Quantum Car Hire</span>
            <h1>Admin panel</h1>
          </div>
          {tab === 'fleet' && (
            <div className="admin-save-indicator" data-status={saveStatus} aria-live="polite">
              <span className="admin-save-dot" aria-hidden="true" />
              <span>
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved' && (lastSavedAt ? `Saved at ${formatSavedTime(lastSavedAt)}` : 'Saved')}
                {saveStatus === 'idle' && 'Autosave on'}
              </span>
            </div>
          )}
          <div className="admin-topbar-actions">
            <Link className="btn btn-ghost" to="/" target="_blank" rel="noopener noreferrer">
              View live site ↗
            </Link>
            <button className="btn btn-ghost" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
        <div className="admin-tabs">
          <button type="button" className={`admin-tab${tab === 'fleet' ? ' active' : ''}`} onClick={() => setTab('fleet')}>
            Fleet & rates
          </button>
          <button type="button" className={`admin-tab${tab === 'bookings' ? ' active' : ''}`} onClick={() => setTab('bookings')}>
            Bookings
          </button>
          <button type="button" className={`admin-tab${tab === 'drivers' ? ' active' : ''}`} onClick={() => setTab('drivers')}>
            Drivers
          </button>
          <button type="button" className={`admin-tab${tab === 'service' ? ' active' : ''}`} onClick={() => setTab('service')}>
            Service
          </button>
        </div>
      </header>

      <main className="admin-content">
        {tab === 'fleet' && (
          <>
            <div className="admin-intro">
              <p>
                Changes save automatically to this browser as you type. Nobody else will see them until you export
                the data below and hand it to whoever deploys the site.
              </p>
              <div className="admin-toolbar">
                <button className="btn btn-primary" type="button" disabled={exporting !== null} onClick={() => handleExport('ts')}>
                  {exporting === 'ts' ? 'Preparing…' : 'Export vehicles.ts'}
                </button>
                <button className="btn btn-ghost-dark" type="button" disabled={exporting !== null} onClick={() => handleExport('json')}>
                  {exporting === 'json' ? 'Preparing…' : 'Export vehicles.json'}
                </button>
                <button className="admin-link-btn admin-reset-all" type="button" onClick={handleResetAll}>
                  Reset all to defaults
                </button>
              </div>
              {exportError && <p className="admin-field-error">{exportError}</p>}
            </div>

            <div className="admin-card-list">
              {vehicles.map((vehicle) => {
                const activeService = activeServiceEvents.find((e) => e.vehicleKey === vehicle.key);
                return <VehicleEditor vehicle={vehicle} unavailableUntil={activeService?.unavailableUntil} key={vehicle.key} />;
              })}
            </div>
          </>
        )}

        {tab === 'bookings' && (
          <>
            <div className="admin-intro">
              <p>Every booking request submitted on the site lands here. Click a day to see its requests, and use the status buttons to mark one Confirmed or Cancelled once you've checked availability.</p>
            </div>
            <BookingsCalendar />
          </>
        )}

        {tab === 'drivers' && (
          <>
            <div className="admin-intro">
              <p>Driver accounts for the driver portal (a separate sign-in at /driver/login). Assign a driver to a confirmed booking from the Bookings tab.</p>
            </div>
            <DriversManager />
          </>
        )}

        {tab === 'service' && (
          <>
            <div className="admin-intro">
              <p>Log servicing, maintenance, inspections and insurance renewals here. A vehicle with an open service record shows an "In service" badge on the Fleet & Rates tab.</p>
            </div>
            <ServiceCalendar />
          </>
        )}
      </main>
    </div>
  );
}
