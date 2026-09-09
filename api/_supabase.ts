import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client, shared by api/book.ts and
 * api/admin-bookings.ts. Uses the service role key, which bypasses Row
 * Level Security — that's intentional (see supabase/schema.sql): the
 * bookings table has no public policies, so this is the only way anything
 * reads or writes it. Never import this from client code.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
