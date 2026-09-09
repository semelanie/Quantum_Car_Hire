const TOKEN_KEY = 'qch_driver_token';
const INFO_KEY = 'qch_driver_info';

export interface DriverSession {
  token: string;
  id: string;
  name: string;
  email: string;
}

export function readDriverSession(): DriverSession | null {
  try {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    const infoRaw = window.sessionStorage.getItem(INFO_KEY);
    if (!token || !infoRaw) return null;
    const info = JSON.parse(infoRaw) as { id: string; name: string; email: string };
    return { token, ...info };
  } catch {
    return null;
  }
}

export function saveDriverSession(token: string, driver: { id: string; name: string; email: string }): void {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    window.sessionStorage.setItem(INFO_KEY, JSON.stringify(driver));
  } catch {
    // Session just won't persist across a reload — driver can sign in again.
  }
}

export function clearDriverSession(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(INFO_KEY);
  } catch {
    // ignore
  }
}
