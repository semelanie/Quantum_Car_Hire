import { useEffect, useState } from 'react';
import { fetchDrivers, createDriver, updateDriver } from './driversApi';
import type { Driver } from '../types/driver';

export default function DriversManager() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchDrivers()
      .then(({ drivers }) => setDrivers(drivers))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !email.trim() || password.length < 8) {
      setFormError('Name, email, and a password of at least 8 characters are required.');
      return;
    }
    setCreating(true);
    try {
      await createDriver({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create that driver.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(driver: Driver) {
    try {
      await updateDriver(driver.id, { active: !driver.active });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update that driver.');
    }
  }

  async function resetPassword(driver: Driver) {
    const next = window.prompt(`New password for ${driver.name} (min 8 characters):`);
    if (!next) return;
    if (next.length < 8) {
      window.alert('Password must be at least 8 characters.');
      return;
    }
    try {
      await updateDriver(driver.id, { password: next });
      window.alert('Password updated.');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not update the password.');
    }
  }

  return (
    <div className="drivers-manager">
      <form className="drivers-form" onSubmit={handleCreate}>
        <h3>Add a driver</h3>
        <div className="drivers-form-grid">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
          </label>
        </div>
        {formError && <p className="admin-field-error">{formError}</p>}
        <button className="btn btn-primary" type="submit" disabled={creating}>
          {creating ? 'Adding…' : 'Add driver'}
        </button>
      </form>

      {error && <p className="admin-field-error">{error}</p>}
      {loading ? (
        <p className="cal-detail-empty">Loading…</p>
      ) : drivers.length === 0 ? (
        <p className="cal-detail-empty">No drivers yet — add one above.</p>
      ) : (
        <div className="drivers-list">
          {drivers.map((d) => (
            <div className={`driver-row${d.active ? '' : ' driver-row--inactive'}`} key={d.id}>
              <div className="driver-row-info">
                <span className="driver-name">
                  {d.name}
                  {!d.active && <span className="driver-badge-inactive">Inactive</span>}
                </span>
                <span className="driver-contact">
                  {d.email}
                  {d.phone ? ` · ${d.phone}` : ''}
                </span>
              </div>
              <div className="driver-row-actions">
                <button type="button" className="admin-link-btn" onClick={() => resetPassword(d)}>
                  Reset password
                </button>
                <button type="button" className="admin-link-btn" onClick={() => toggleActive(d)}>
                  {d.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
