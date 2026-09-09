import { getSupabase } from './_supabase';
import { ADMIN_PASSWORD } from '../src/admin/config';

/**
 * Vehicle service/maintenance calendar (src/admin/ServiceCalendar.tsx).
 *
 *   GET    /api/admin-service-events?month=YYYY-MM   → { events: ServiceEvent[] }
 *   GET    /api/admin-service-events?activeOnly=1    → events still marking a
 *          vehicle unavailable today (for the Fleet & Rates "Unavailable" badge)
 *   POST   /api/admin-service-events   { ...fields, documents? } → { event }
 *   PATCH  /api/admin-service-events   { id, ...fields, addDocuments?, removeDocumentPaths? } → { event }
 *
 * Documents are uploaded as base64 data URLs in the JSON body (simplest way
 * to keep this on the same fetch-handler style as every other endpoint here
 * — no multipart parsing) and stored in a private Supabase Storage bucket
 * (`service-documents`, created by supabase/schema.sql). GET responses
 * include short-lived signed URLs so the admin panel can view/download them
 * without the bucket ever being public.
 */

const DOCUMENT_SIGNED_URL_TTL = 60 * 60; // 1 hour, seconds
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024; // 8MB per file

interface IncomingDocument {
  name?: string;
  dataUrl?: string;
}

interface EventPayload {
  vehicleKey?: string;
  vehicleLabel?: string;
  registration?: string;
  serviceType?: string;
  serviceDate?: string;
  serviceTime?: string;
  unavailableUntil?: string;
  mileage?: number | null;
  provider?: string;
  cost?: number | null;
  nextServiceDate?: string | null;
  notes?: string;
  documents?: IncomingDocument[];
}

interface UpdatePayload extends Partial<EventPayload> {
  id?: string;
  addDocuments?: IncomingDocument[];
  removeDocumentPaths?: string[];
}

interface StoredDocument {
  name: string;
  path: string;
  size: number;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType };
}

async function uploadDocuments(
  db: ReturnType<typeof getSupabase> & object,
  eventId: string,
  incoming: IncomingDocument[] | undefined,
): Promise<{ docs: StoredDocument[]; errors: string[] }> {
  const docs: StoredDocument[] = [];
  const errors: string[] = [];
  for (const doc of incoming ?? []) {
    if (!doc.name || !doc.dataUrl) continue;
    const decoded = dataUrlToBytes(doc.dataUrl);
    if (!decoded) {
      errors.push(`Couldn't read "${doc.name}" — try a different file.`);
      continue;
    }
    if (decoded.bytes.byteLength > MAX_DOCUMENT_BYTES) {
      errors.push(`"${doc.name}" is too large (max 8MB).`);
      continue;
    }
    const safeName = doc.name.replace(/[^\w.\- ]/g, '_');
    const path = `${eventId}/${Date.now()}-${safeName}`;
    const { error } = await db.storage.from('service-documents').upload(path, decoded.bytes, {
      contentType: decoded.contentType,
      upsert: false,
    });
    if (error) {
      errors.push(`Couldn't upload "${doc.name}": ${error.message}`);
      continue;
    }
    docs.push({ name: doc.name, path, size: decoded.bytes.byteLength });
  }
  return { docs, errors };
}

async function toEventWithUrls(db: ReturnType<typeof getSupabase> & object, row: Record<string, unknown>) {
  const documents = Array.isArray(row.documents) ? (row.documents as StoredDocument[]) : [];
  const withUrls = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await db.storage.from('service-documents').createSignedUrl(doc.path, DOCUMENT_SIGNED_URL_TTL);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vehicleKey: row.vehicle_key,
    vehicleLabel: row.vehicle_label,
    registration: row.registration ?? '',
    serviceType: row.service_type,
    serviceDate: row.service_date,
    serviceTime: row.service_time ?? '',
    unavailableUntil: row.unavailable_until,
    mileage: row.mileage ?? null,
    provider: row.provider ?? '',
    cost: row.cost ?? null,
    nextServiceDate: row.next_service_date ?? null,
    notes: row.notes ?? '',
    documents: withUrls,
  };
}

export default {
  async fetch(request: Request) {
    if (request.headers.get('x-admin-token') !== ADMIN_PASSWORD) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const db = getSupabase();
    if (!db) {
      return Response.json({ error: 'Service storage isn’t set up yet — see supabase/schema.sql.' }, { status: 500 });
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const month = url.searchParams.get('month');
      const activeOnly = url.searchParams.get('activeOnly') === '1';

      let query = db.from('service_events').select('*').order('service_date', { ascending: true });
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [y, m] = month.split('-').map(Number);
        const start = `${month}-01`;
        const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
        query = query.gte('service_date', start).lt('service_date', nextMonth);
      }
      if (activeOnly) {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte('unavailable_until', today);
      }

      const { data, error } = await query;
      if (error) return Response.json({ error: error.message }, { status: 500 });
      const events = await Promise.all((data ?? []).map((row) => toEventWithUrls(db, row)));
      return Response.json({ events });
    }

    if (request.method === 'POST') {
      let body: EventPayload;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
      }
      if (!body.vehicleKey || !body.serviceType || !body.serviceDate) {
        return Response.json({ error: 'Vehicle, service type and service date are required.' }, { status: 400 });
      }

      const { data: inserted, error: insertError } = await db
        .from('service_events')
        .insert({
          vehicle_key: body.vehicleKey,
          vehicle_label: body.vehicleLabel || body.vehicleKey,
          registration: body.registration || null,
          service_type: body.serviceType,
          service_date: body.serviceDate,
          service_time: body.serviceTime || null,
          unavailable_until: body.unavailableUntil || body.serviceDate,
          mileage: body.mileage ?? null,
          provider: body.provider || null,
          cost: body.cost ?? null,
          next_service_date: body.nextServiceDate || null,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

      const { docs, errors } = await uploadDocuments(db, inserted.id as string, body.documents);
      if (docs.length > 0) {
        await db.from('service_events').update({ documents: docs }).eq('id', inserted.id);
        inserted.documents = docs;
      }

      const event = await toEventWithUrls(db, inserted);
      return Response.json({ event, uploadErrors: errors.length ? errors : undefined });
    }

    if (request.method === 'PATCH') {
      let body: UpdatePayload;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'Invalid request body.' }, { status: 400 });
      }
      if (!body.id) return Response.json({ error: 'id is required.' }, { status: 400 });

      const { data: existing, error: fetchError } = await db
        .from('service_events')
        .select('*')
        .eq('id', body.id)
        .maybeSingle();
      if (fetchError) return Response.json({ error: fetchError.message }, { status: 500 });
      if (!existing) return Response.json({ error: 'Service event not found.' }, { status: 404 });

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.vehicleKey !== undefined) update.vehicle_key = body.vehicleKey;
      if (body.vehicleLabel !== undefined) update.vehicle_label = body.vehicleLabel;
      if (body.registration !== undefined) update.registration = body.registration || null;
      if (body.serviceType !== undefined) update.service_type = body.serviceType;
      if (body.serviceDate !== undefined) update.service_date = body.serviceDate;
      if (body.serviceTime !== undefined) update.service_time = body.serviceTime || null;
      if (body.unavailableUntil !== undefined) update.unavailable_until = body.unavailableUntil;
      if (body.mileage !== undefined) update.mileage = body.mileage;
      if (body.provider !== undefined) update.provider = body.provider || null;
      if (body.cost !== undefined) update.cost = body.cost;
      if (body.nextServiceDate !== undefined) update.next_service_date = body.nextServiceDate || null;
      if (body.notes !== undefined) update.notes = body.notes || null;

      let documents = Array.isArray(existing.documents) ? (existing.documents as StoredDocument[]) : [];
      const uploadErrors: string[] = [];

      if (body.removeDocumentPaths?.length) {
        const toRemove = new Set(body.removeDocumentPaths);
        await db.storage.from('service-documents').remove(Array.from(toRemove));
        documents = documents.filter((d) => !toRemove.has(d.path));
      }
      if (body.addDocuments?.length) {
        const { docs, errors } = await uploadDocuments(db, body.id, body.addDocuments);
        documents = [...documents, ...docs];
        uploadErrors.push(...errors);
      }
      if (body.removeDocumentPaths?.length || body.addDocuments?.length) {
        update.documents = documents;
      }

      const { data, error } = await db.from('service_events').update(update).eq('id', body.id).select().maybeSingle();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (!data) return Response.json({ error: 'Service event not found.' }, { status: 404 });

      const event = await toEventWithUrls(db, data);
      return Response.json({ event, uploadErrors: uploadErrors.length ? uploadErrors : undefined });
    }

    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST, PATCH' } });
  },
};
