import { useState } from 'react';
import type { FormEvent } from 'react';
import logo from '../assets/logo-transparent.png';
import { driverLogin } from './driverBookingsApi';
import { saveDriverSession } from './driverAuth';

interface DriverLoginPageProps {
  onLogin: () => void;
}

export default function DriverLoginPage({ onLogin }: DriverLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, driver } = await driverLogin(email.trim(), password);
      saveDriverSession(token, driver);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-gate">
      <form className="admin-gate-card" onSubmit={handleSubmit}>
        <img className="admin-gate-logo" src={logo} alt="Quantum Car Hire" />
        <span className="eyebrow">Quantum Car Hire</span>
        <h1>Driver sign-in</h1>
        <p className="admin-gate-hint">Sign in to see your assigned pickups and drop-offs.</p>
        <input
          type="email"
          autoFocus
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
        />
        {error && <p className="admin-gate-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <a className="admin-gate-back" href="/">
          ← Back to the site
        </a>
      </form>
    </div>
  );
}
