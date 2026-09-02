import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVehicles } from '../context/VehiclesContext';
import VehicleEditor from './VehicleEditor';
import { exportVehiclesAsJson, exportVehiclesAsTs } from './exportData';
import { ADMIN_SESSION_KEY } from './config';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const { vehicles, resetAll } = useVehicles();
  const [exporting, setExporting] = useState<'json' | 'ts' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

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
          <div className="admin-topbar-actions">
            <Link className="btn btn-ghost" to="/" target="_blank" rel="noopener noreferrer">
              View live site ↗
            </Link>
            <button className="btn btn-ghost" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-intro">
          <p>
            Changes save automatically to this browser as you type. Nobody else will see them until you export the
            data below and hand it to whoever deploys the site.
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
          {vehicles.map((vehicle) => (
            <VehicleEditor vehicle={vehicle} key={vehicle.key} />
          ))}
        </div>
      </main>
    </div>
  );
}
