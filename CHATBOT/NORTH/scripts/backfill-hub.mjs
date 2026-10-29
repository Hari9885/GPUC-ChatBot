// Replay every saved chatbot inquiry to the Central Admission Hub, plus
// anything left in the outbox. The hub dedupes by event id, so it is safe to
// run often (a daily cron works). Usage: HUB_URL=... HUB_CAMPUS=... HUB_SECRET=... npm run backfill-hub
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

if (!process.env.HUB_URL || !process.env.HUB_CAMPUS || !process.env.HUB_SECRET) {
  console.error('Set HUB_URL, HUB_CAMPUS and HUB_SECRET first (see .env.example).');
  process.exit(1);
}
const { createHmac } = await import('node:crypto');

const sign = (secret, ts, body) => 'sha256=' + createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

// Mirror src/lib/hub.ts hubEventFor so the script works with plain node (no tsx/tsconfig).
const HUB_STATUS = {
  NEW: 'submitted', ASSIGNED: 'submitted', CONTACT_PENDING: 'submitted', CONTACT_ATTEMPTED: 'submitted',
  FOLLOW_UP_SCHEDULED: 'submitted', APPOINTMENT_REQUESTED: 'submitted', APPOINTMENT_CONFIRMED: 'submitted',
  RESOLVED: 'under_review', REJECTED: 'rejected', CANCELLED: 'cancelled', CLOSED: 'closed',
};
function splitName(fullName) {
  const m = (fullName || '').match(/^(.*)\s*\((?:Parent|parent):\s*(.*)\)$/);
  return m ? { student: m[1].trim(), parent: m[2].trim() } : { student: (fullName || '').trim(), parent: '' };
}
function hubEventFor(inquiry) {
  const { student, parent } = splitName(inquiry.name);
  return {
    event: 'enquiry.upserted',
    event_id: `${process.env.HUB_CAMPUS}:${inquiry.id}:${inquiry.updatedAt}`,
    occurred_at: inquiry.updatedAt,
    enquiry: {
      id: inquiry.id, enquiry_no: inquiry.id, status: HUB_STATUS[inquiry.status] || 'submitted',
      student_name: student, mobile_number: inquiry.mobile, father_name: parent,
      created_at: inquiry.createdAt, updated_at: inquiry.updatedAt, city: inquiry.location,
      course_interest: inquiry.courseInterest, intended_year: inquiry.intendedYear,
      inquiry_category: inquiry.category, consent: !!inquiry.consentGiven,
    },
    attribution: { source: 'chatbot', medium: 'chat', campaign: process.env.HUB_CAMPUS,
      capture_channel: 'web_public_form', referred_by: inquiry.assignedStaff || '' },
  };
}

const dbFile = path.join(process.cwd(), 'data', 'db.json');
if (!existsSync(dbFile)) {
  console.error('No data/db.json found; nothing to send.');
  process.exit(1);
}
const db = JSON.parse(readFileSync(dbFile, 'utf8'));
const items = [...(db.inquiries || []), ...(db.appointments ? [] : [])];

const outboxFile = path.join(process.cwd(), 'data', 'hub_outbox.json');
if (existsSync(outboxFile)) {
  const rows = JSON.parse(readFileSync(outboxFile, 'utf8'));
  items.push(...rows.map((r) => r.payload));
}

let ok = 0, dup = 0, fail = 0;
for (const item of items) {
  const payload = item.enquiry ? item : hubEventFor(item);
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  try {
    const res = await fetch(`${process.env.HUB_URL.replace(/\/$/, '')}/hub/v1/connect/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Campus': process.env.HUB_CAMPUS,
        'X-Hub-Timestamp': ts,
        'X-Hub-Signature': sign(process.env.HUB_SECRET, ts, body),
      },
      body,
    });
    const text = await res.text();
    if (res.ok) {
      const out = JSON.parse(text);
      if (out.status === 'duplicate') dup += 1; else ok += 1;
    } else { fail += 1; console.error(`  ${payload.event_id} -> ${res.status} ${text.slice(0, 200)}`); }
  } catch (err) {
    fail += 1;
    console.error(`  ${payload.event_id} -> ${err}`);
  }
}
console.log(`Hub backfill: ${ok} sent, ${dup} already known, ${fail} failed (re-run to retry).`);
