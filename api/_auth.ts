/**
 * Password hashing and session tokens for the driver portal
 * (api/driver-login.ts, api/driver-bookings.ts). Built entirely on Web
 * Crypto (`crypto.subtle`), which is available in Vercel's Edge runtime
 * without any native dependency — no bcrypt/jsonwebtoken package needed.
 *
 * Passwords: PBKDF2-SHA256 with a random salt per password, stored as
 * "iterations:saltHex:hashHex" in drivers.password_hash. Never plaintext,
 * never a fast unsalted hash.
 *
 * Sessions: a small HMAC-SHA256-signed token (`<payload>.<signature>`,
 * base64url) containing the driver id and an expiry. Not a full JWT — just
 * enough to prove "this token was issued by us and hasn't expired" without
 * pulling in a library. Requires DRIVER_AUTH_SECRET to be set (see
 * .env.example); a missing secret fails closed (throws), it never falls
 * back to something unsigned.
 */

const PBKDF2_ITERATIONS = 100_000;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_ITERATIONS}:${bufToHex(salt)}:${bufToHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const [iterationsStr, saltHex, hashHex] = parts;
  const iterations = Number(iterationsStr);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = hexToBytes(saltHex);
  const computed = await pbkdf2(password, salt, iterations);
  return timingSafeEqual(bufToHex(computed), hashHex);
}

function base64url(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(value: string): Uint8Array {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.DRIVER_AUTH_SECRET;
  if (!secret) {
    throw new Error('DRIVER_AUTH_SECRET is not set — see .env.example.');
  }
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

interface DriverTokenPayload {
  driverId: string;
  exp: number;
}

export async function signDriverToken(driverId: string): Promise<string> {
  const payload: DriverTokenPayload = { driverId, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64url(signature)}`;
}

/** Returns the driver id if the token is validly signed and unexpired, else null. */
export async function verifyDriverToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await getSigningKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlDecode(sigB64) as BufferSource,
      new TextEncoder().encode(payloadB64) as BufferSource,
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as DriverTokenPayload;
    if (!payload.exp || payload.exp < Date.now() || !payload.driverId) return null;
    return payload.driverId;
  } catch {
    return null;
  }
}

/** Pulls the bearer token out of a request's Authorization header. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}
