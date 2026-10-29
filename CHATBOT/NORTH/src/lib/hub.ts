// Push this branch's chatbot enquiries to the Central Admission Hub.
//
// The hub accepts signed events: HMAC-SHA256 over `${timestamp}.${rawBody}`,
// headers X-Hub-Campus / X-Hub-Timestamp / X-Hub-Signature, endpoint
// POST ${HUB_URL}/hub/v1/connect/leads. The event id is stable per inquiry
// + last-update, so re-sending is safe and deduplicated by the hub.
//
// Never blocks the user: any failure lands in data/hub_outbox.json and is
// retried by `npm run backfill-hub`. Inactive unless all three of HUB_URL,
// HUB_CAMPUS and HUB_SECRET are set.
import { createHmac } from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Inquiry } from '@/lib/db';

const dataFile = (name: string) => path.join(process.cwd(), 'data', name);

export const hubConfig = {
  url: process.env.HUB_URL || '',
  campus: process.env.HUB_CAMPUS || '',
  secret: process.env.HUB_SECRET || '',
};

export function hubEnabled(): boolean {
  return !!(hubConfig.url && hubConfig.campus && hubConfig.secret);
}

// The bot's statuses are upper-case; the hub works in lower case.
// "submitted" stays open in the hub; approval and fee stages arrive from the
// branch's own admission system, not the chatbot.
const HUB_STATUS: Record<string, string> = {
  NEW: 'submitted',
  ASSIGNED: 'submitted',
  CONTACT_PENDING: 'submitted',
  CONTACT_ATTEMPTED: 'submitted',
  FOLLOW_UP_SCHEDULED: 'submitted',
  APPOINTMENT_REQUESTED: 'submitted',
  APPOINTMENT_CONFIRMED: 'submitted',
  RESOLVED: 'under_review',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  CLOSED: 'closed',
};

// The bot stores "Student (Parent: name)" in one field; split it back apart.
function splitName(fullName: string): { student: string; parent: string } {
  const m = (fullName || '').match(/^(.*)\s*\((?:Parent|parent):\s*(.*)\)$/);
  return m ? { student: m[1].trim(), parent: m[2].trim() } : { student: (fullName || '').trim(), parent: '' };
}

export function hubEventFor(inquiry: Inquiry): Record<string, unknown> {
  const { student, parent } = splitName(inquiry.name);
  return {
    event: 'enquiry.upserted',
    event_id: `${hubConfig.campus}:${inquiry.id}:${inquiry.updatedAt}`,
    occurred_at: inquiry.updatedAt,
    enquiry: {
      id: inquiry.id,
      enquiry_no: inquiry.id,
      status: HUB_STATUS[inquiry.status] || 'submitted',
      student_name: student,
      mobile_number: inquiry.mobile,
      father_name: parent,
      created_at: inquiry.createdAt,
      updated_at: inquiry.updatedAt,
      city: inquiry.location,
      course_interest: inquiry.courseInterest,
      intended_year: inquiry.intendedYear,
      inquiry_category: inquiry.category,
      consent: !!inquiry.consentGiven, // the wizard records consent when the parent submits details
    },
    attribution: {
      source: 'chatbot',
      medium: 'chat',
      campaign: hubConfig.campus,
      capture_channel: 'web_public_form',
      referred_by: inquiry.assignedStaff || '',
    },
  };
}

type OutboxRow = { event_id: string; payload: Record<string, unknown>; attempts: number; last_error?: string; at: string };

function readOutbox(): OutboxRow[] {
  const file = dataFile('hub_outbox.json');
  try {
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as OutboxRow[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(rows: OutboxRow[]): void {
  const file = dataFile('hub_outbox.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), 'utf8');
}

function sign(secret: string, timestamp: string, body: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`, 'utf8').digest('hex');
}

async function post(payload: Record<string, unknown>): Promise<{ ok: boolean; status: number; text: string }> {
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  const res = await fetch(`${hubConfig.url.replace(/\/$/, '')}/hub/v1/connect/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Campus': hubConfig.campus,
      'X-Hub-Timestamp': ts,
      'X-Hub-Signature': sign(hubConfig.secret, ts, body),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  return { ok: res.ok, status: res.status, text: (await res.text()).slice(0, 300) };
}

/**
 * Send one inquiry to the hub. Never throws: a failed send is appended to the
 * outbox and retried by the backfill script. A 401 (bad secret) is logged but
 * not queued — retrying a broken secret only fills the outbox; the operator
 * must fix HUB_SECRET.
 */
export async function pushInquiry(inquiry: Inquiry): Promise<void> {
  if (!hubEnabled()) return;
  const payload = hubEventFor(inquiry);
  try {
    const res = await post(payload);
    if (res.ok) {
      writeOutbox(readOutbox().filter((r) => r.event_id !== payload.event_id));
      return;
    }
    if (res.status === 401) {
      console.error('[hub] 401 from the admission hub - check HUB_SECRET/HUB_CAMPUS. Not queued.');
      return;
    }
    throw new Error(`HTTP ${res.status}: ${res.text}`);
  } catch (err) {
    const rows = readOutbox().filter((r) => r.event_id !== payload.event_id);
    rows.push({ event_id: String(payload.event_id), payload, attempts: 1, last_error: String(err), at: new Date().toISOString() });
    writeOutbox(rows);
    console.error(`[hub] queued ${String(payload.event_id)} for retry: ${err}`);
  }
}
