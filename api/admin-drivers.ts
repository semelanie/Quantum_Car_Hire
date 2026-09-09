import { getSupabase } from './_supabase';
import { ADMIN_PASSWORD } from '../src/admin/config';
import { hashPassword } from './_auth';

/**
 * Manage driver accounts (src/admin/DriversManager.tsx). Passwords are
 * never returned — only set (on create) or reset (via PATCH with a new
 * `password`).
 *
 *   GET    /api/admin-drivers                → { drivers: Driver[] }
 *   POST   /api/admin-drivers  { name, email, phone?, password } → { driver }
 *   PATCH  /api/admin-drivers  { id, name?, phone?, active?, password? } → { driver }
 */

interface CreatePayload {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

interface UpdatePayload {
  id?: string;
  name?: string;
  phone?: string;
  active?: boolean;
  password?: string;
}

function toDriver(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default {
  async fetch(request: Request) {
    if (request.headers.get('x-admin-token') !== ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
      return Response.json({ error: 'Driver storage isn’t set up yet — see supabase/schema.sql.' }, { status: 500 });
    }

    if (request.method === 'GET') {
      const { data, error } = await db.from('drivers').select('*').order('name', { ascending: true });
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ drivers: (data ?? []).map(toDriver) });
    }

    if (request.method === 'POST') {
      let body: CreatePayload;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
      }
      const name = (body.name ?? '').trim();
      const email = (body.email ?? '').trim().toLowerCase();
      const phone = (body.phone ?? '').trim();
      const password = body.password ?? '';

      if (!name || !email || !password) {
        return Response.json({ error: 'Name, email and a password are required.' }, { status: 400 });
      }
      if (!isValidEmail(email)) {
        return Response.json({ error: "That email address doesn't look right." }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const { data, error } = await db
        .from('drivers')
        .insert({ name, email, phone, password_hash: passwordHash })
        .select()
        .single();

      if (error) {
        const message = error.code === '23505' ? 'A driver with that email already exists.' : error.message;
        return Response.json({ error: message }, { status: 400 });
      }
      return Response.json({ driver: toDriver(data) });
    }

    if (request.method === 'PATCH') {
      let body: UpdatePayload;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
      }
      if (!body.id) {
        return Response.json({ error: 'id is required.' }, { status: 400 });
      }

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.name !== undefined) update.name = body.name.trim();
      if (body.phone !== undefined) update.phone = body.phone.trim();
      if (body.active !== undefined) update.active = body.active;
      if (body.password) {
        if (body.password.length < 8) {
          return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }
        update.password_hash = await hashPassword(body.password);
      }

      const { data, error } = await db.from('drivers').update(update).eq('id', body.id).select().maybeSingle();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (!data) return Response.json({ error: 'Driver not found.' }, { status: 404 });
      return Response.json({ driver: toDriver(data) });
    }

    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST, PATCH' } });
  },
};
