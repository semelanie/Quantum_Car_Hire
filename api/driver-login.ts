import { getSupabase } from './_supabase';
import { verifyPassword, signDriverToken } from './_auth';

interface LoginPayload {
  email?: string;
  password?: string;
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    }

    let body: LoginPayload;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    if (!email || !password) {
      return Response.json({ error: 'Enter your email and password.' }, { status: 400 });
    }

    const db = getSupabase();
    if (!db) {
      return Response.json({ error: 'The driver portal isn’t set up yet — ask your admin.' }, { status: 500 });
    }

    const { data: driver, error } = await db
      .from('drivers')
      .select('id, name, email, active, password_hash')
      .eq('email', email)
      .maybeSingle();

    // Same error for "no such driver" and "wrong password" — don't reveal
    // which one it was.
    if (error || !driver || !driver.active) {
      return Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const ok = await verifyPassword(password, driver.password_hash);
    if (!ok) {
      return Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    let token: string;
    try {
      token = await signDriverToken(driver.id);
    } catch {
      return Response.json({ error: 'The driver portal isn’t fully set up yet — ask your admin.' }, { status: 500 });
    }

    return Response.json({ token, driver: { id: driver.id, name: driver.name, email: driver.email } });
  },
};
