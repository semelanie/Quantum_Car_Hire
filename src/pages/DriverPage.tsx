import { useState } from 'react';
import '../admin/admin.css';
import '../driver/driver.css';
import DriverLoginPage from '../driver/DriverLoginPage';
import DriverApp from '../driver/DriverApp';
import { readDriverSession } from '../driver/driverAuth';

export default function DriverPage() {
  const [authed, setAuthed] = useState(() => readDriverSession() !== null);

  if (!authed) {
    return <DriverLoginPage onLogin={() => setAuthed(true)} />;
  }

  return <DriverApp onLogout={() => setAuthed(false)} />;
}
