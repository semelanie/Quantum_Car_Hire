import { useState } from 'react';
import '../admin/admin.css';
import PasswordGate from '../admin/PasswordGate';
import AdminPanel from '../admin/AdminPanel';
import { ADMIN_SESSION_KEY } from '../admin/config';

function readAuthed(): boolean {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(readAuthed);

  if (!authed) {
    return <PasswordGate onUnlock={() => setAuthed(true)} />;
  }

  return <AdminPanel onLogout={() => setAuthed(false)} />;
}
