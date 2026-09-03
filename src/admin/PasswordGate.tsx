import { useState } from 'react';
import type { FormEvent } from 'react';
import logo from '../assets/logo.jpeg';
import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from './config';

interface PasswordGateProps {
  onUnlock: () => void;
}

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try {
        window.sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      } catch {
        // sessionStorage unavailable — the gate will just re-appear on reload, that's fine.
      }
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  }

  return (
    <div className="admin-gate">
      <form className="admin-gate-card" onSubmit={handleSubmit}>
        <img className="admin-gate-logo" src={logo} alt="Quantum Car Hire" />
        <span className="eyebrow">Quantum Car Hire</span>
        <h1>Admin sign-in</h1>
        <p className="admin-gate-hint">Enter the admin password to edit rates, vehicles and photos.</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          inputMode="text"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
        />
        {error && <p className="admin-gate-error">That password isn&apos;t right — try again.</p>}
        <button className="btn btn-primary" type="submit">
          Sign in
        </button>
        <a className="admin-gate-back" href="/">
          ← Back to the site
        </a>
      </form>
    </div>
  );
}
