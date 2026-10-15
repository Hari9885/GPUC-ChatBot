import fs from 'fs';
import path from 'path';

export interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  parentName?: string;
  location?: string;
  userType?: string;
  courseInterest?: string;
  intendedYear?: string;
  category: string;
  preferredContact: string;
  preferredLanguage?: string;
  summary: string;
  assignedTeam: string;
  assignedStaff?: string;
  status: 'NEW' | 'ASSIGNED' | 'CONTACT_PENDING' | 'CONTACT_ATTEMPTED' | 'FOLLOW_UP_SCHEDULED' | 'APPOINTMENT_REQUESTED' | 'APPOINTMENT_CONFIRMED' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  consentGiven: boolean;
  consentPurpose: string;
  consentTimestamp: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  inquiryId?: string;
  name: string;
  mobile: string;
  mode: 'campus_visit' | 'online_meeting' | 'callback';
  date: string;
  timeSlot: string;
  purpose: string;
  assignedStaff: string;
  assignedDepartment: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  meetingLinkOrVenue: string;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  department: string;
  mode: 'campus_visit' | 'online_meeting' | 'callback' | 'all';
  isBooked: boolean;
  bookedBy?: string;
}

export interface FeedbackRecord {
  id: string;
  inquiryId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface MessageLog {
  id: string;
  type: 'whatsapp' | 'email';
  recipient: string;
  templateId: string;
  content: string;
  status: 'SUBMITTED' | 'DELIVERED';
  timestamp: string;
}

interface DatabaseSchema {
  inquiries: Inquiry[];
  appointments: Appointment[];
  slots: TimeSlot[];
  feedback: FeedbackRecord[];
  messages: MessageLog[];
}

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export const ADMISSION_TIMES = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

function initializeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = new Date();

  // Generate slots for the next 7 business days
  for (let d = 1; d <= 7; d++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + d);
    if (nextDate.getDay() === 0) continue; // Skip Sunday

    const dateStr = nextDate.toISOString().split('T')[0];

    ADMISSION_TIMES.forEach((time, idx) => {
      slots.push({
        id: `slot_${dateStr}_${idx}`,
        date: dateStr,
        time,
        department: 'Admissions',
        mode: 'all',
        isBooked: false,
      });
    });
  }
  return slots;
}

export function ensureSlots(db: DatabaseSchema): boolean {
  if (!db.slots) {
    db.slots = initializeSlots();
    return true;
  }
  let modified = false;
  const today = new Date();

  for (let d = 1; d <= 7; d++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + d);
    if (nextDate.getDay() === 0) continue;

    const dateStr = nextDate.toISOString().split('T')[0];

    ADMISSION_TIMES.forEach((time, idx) => {
      const exists = db.slots.some((s) => s.date === dateStr && s.time === time);
      if (!exists) {
        db.slots.push({
          id: `slot_${dateStr}_${idx}`,
          date: dateStr,
          time,
          department: 'Admissions',
          mode: 'all',
          isBooked: false,
        });
        modified = true;
      }
    });
  }
  return modified;
}

function getInitialData(): DatabaseSchema {
  return {
    inquiries: [
      {
        id: 'GPUC-2026-INQ-1001',
        name: 'Suresh Kumar',
        mobile: '+91 98450 12345',
        userType: 'parent',
        courseInterest: 'Science (PCMC)',
        intendedYear: '2026-2027',
        category: 'ADMISSION_PROCESS',
        preferredContact: 'phone',
        summary: 'Enquiring about PCMC combination, laboratory facilities, and admission requirements for daughter.',
        assignedTeam: 'Admissions',
        assignedStaff: 'Mr. Aravind J',
        status: 'ASSIGNED',
        consentGiven: true,
        consentPurpose: 'Inquiry response and admission guidance',
        consentTimestamp: new Date().toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
    appointments: [
      {
        id: 'GPUC-2026-APT-501',
        inquiryId: 'GPUC-2026-INQ-1001',
        name: 'Suresh Kumar',
        mobile: '+91 98450 12345',
        mode: 'campus_visit',
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        timeSlot: '11:30 AM',
        purpose: 'Campus tour and laboratory inspection',
        assignedStaff: 'Admissions Office',
        assignedDepartment: 'Admissions',
        status: 'CONFIRMED',
        meetingLinkOrVenue: 'GPUC Campus Administrative Block, 181/1, Hoodi, Bengaluru',
        createdAt: new Date().toISOString(),
      },
    ],
    slots: initializeSlots(),
    feedback: [
      {
        id: 'FB-01',
        inquiryId: 'GPUC-2026-INQ-1001',
        rating: 5,
        comment: 'Very helpful and polite assistant!',
        createdAt: new Date().toISOString(),
      },
    ],
    messages: [
      {
        id: 'MSG-001',
        type: 'whatsapp',
        recipient: '+91 98450 12345',
        templateId: 'appointment_confirmation',
        content: 'Dear Suresh Kumar, your Campus Visit at Gopalan PU College is confirmed for 11:30 AM. Ref: GPUC-2026-APT-501.',
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function readDB(): DatabaseSchema {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data: DatabaseSchema = JSON.parse(raw);
    const updated = ensureSlots(data);
    if (updated) {
      writeDB(data);
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return getInitialData();
  }
}

export function writeDB(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) {
    // If tomorrow is Sunday, skip to Monday
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  return tomorrow.toISOString().split('T')[0];
}

export function normalizeTime(time: string): string {
  const t = time.trim().toUpperCase().replace(/\s+/g, ' ');
  if (/^0?9(:00)?(\s*AM)?$/i.test(t)) return '09:00 AM';
  if (/^0?9:30(\s*AM)?$/i.test(t)) return '09:30 AM';
  if (/^10(:00)?(\s*AM)?$/i.test(t)) return '10:00 AM';
  if (/^10:30(\s*AM)?$/i.test(t)) return '10:30 AM';
  if (/^11(:00)?(\s*AM)?$/i.test(t)) return '11:00 AM';
  if (/^11:30(\s*AM)?$/i.test(t)) return '11:30 AM';
  if (/^12(:00)?(\s*PM)?$/i.test(t)) return '12:00 PM';
  if (/^12:30(\s*PM)?$/i.test(t)) return '12:30 PM';
  if (/^(0?2|14)(:00)?(\s*PM)?$/i.test(t)) return '02:00 PM';
  if (/^(0?2|14):30(\s*PM)?$/i.test(t)) return '02:30 PM';
  if (/^(0?3|15)(:00)?(\s*PM)?$/i.test(t)) return '03:00 PM';
  if (/^(0?3|15):30(\s*PM)?$/i.test(t)) return '03:30 PM';
  if (/^(0?4|16)(:00)?(\s*PM)?$/i.test(t)) return '04:00 PM';
  if (/^(0?4|16):30(\s*PM)?$/i.test(t)) return '04:30 PM';
  if (/^(0?5|17)(:00)?(\s*PM)?$/i.test(t)) return '05:00 PM';
  return time;
}

export function getAvailableSlotsForDate(
  db: DatabaseSchema,
  date: string,
  department = 'Admissions'
): TimeSlot[] {
  return db.slots.filter(
    (s) =>
      s.date === date &&
      !s.isBooked &&
      (department === 'All' || s.department.toLowerCase().includes(department.toLowerCase()))
  );
}

export function checkSlotAvailability(
  db: DatabaseSchema,
  date: string,
  time: string,
  department = 'Admissions'
): { available: boolean; slot?: TimeSlot; reason?: string } {
  const normTime = normalizeTime(time);
  const slot = db.slots.find(
    (s) =>
      s.date === date &&
      (s.time === normTime || normalizeTime(s.time) === normTime) &&
      (department === 'All' || s.department.toLowerCase() === department.toLowerCase() || s.department.toLowerCase().includes('admissions'))
  );

  if (!slot) {
    return { available: false, reason: 'No slot found for this time' };
  }
  if (slot.isBooked) {
    return { available: false, slot, reason: 'Slot already booked' };
  }
  return { available: true, slot };
}

export function getNextAvailableSlot(
  db: DatabaseSchema,
  afterDate?: string,
  afterTime?: string,
  department = 'Admissions'
): TimeSlot | null {
  const minDate = afterDate || getTomorrowDateString();
  const sorted = [...db.slots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  for (const slot of sorted) {
    if (slot.isBooked) continue;
    if (department && department !== 'All') {
      if (!slot.department.toLowerCase().includes(department.toLowerCase())) continue;
    }
    if (slot.date < minDate) continue;
    if (slot.date === minDate && afterTime) {
      if (normalizeTime(slot.time) <= normalizeTime(afterTime)) continue;
    }
    return slot;
  }
  return null;
}

export function bookAppointment(
  db: DatabaseSchema,
  params: {
    name: string;
    mobile: string;
    mode: 'campus_visit' | 'online_meeting';
    date?: string;
    timeSlot?: string;
    purpose?: string;
    inquiryId?: string;
  }
): { success: boolean; appointment: Appointment; slot?: TimeSlot } {
  const refNum = (500 + (db.appointments?.length || 0) + 1).toString();
  const finalDate = params.date || getTomorrowDateString();
  const finalTime = params.timeSlot ? normalizeTime(params.timeSlot) : (params.mode === 'online_meeting' ? '09:00 AM' : '8:30 AM - 5:00 PM');

  let meetingLinkOrVenue = '';
  let id = '';

  if (params.mode === 'campus_visit') {
    id = `GPUC-VISIT-2026-${refNum}`;
    meetingLinkOrVenue = 'Gopalan Pre-University College, North Campus, No. 79 Mavallipura, Hesaragatta Hobli, Yelahanka, Bengaluru - 560089';
  } else {
    id = `GPUC-2026-APT-${refNum}`;
    meetingLinkOrVenue = 'Online Consultation (Admissions Team)';
  }

  // Find slot to book if applicable
  let bookedSlot: TimeSlot | undefined;
  if (params.mode === 'online_meeting') {
    const slotIdx = db.slots.findIndex(
      (s) => s.date === finalDate && (s.time === finalTime || normalizeTime(s.time) === finalTime)
    );
    if (slotIdx >= 0) {
      db.slots[slotIdx].isBooked = true;
      db.slots[slotIdx].bookedBy = params.name;
      bookedSlot = db.slots[slotIdx];
    }
  }

  const newAppointment: Appointment = {
    id,
    inquiryId: params.inquiryId,
    name: params.name,
    mobile: params.mobile,
    mode: params.mode,
    date: finalDate,
    timeSlot: finalTime,
    purpose: params.purpose || (params.mode === 'campus_visit' ? 'Campus Visit & Document Verification' : 'Online Admission Consultation'),
    assignedStaff: 'Admissions Desk Counselor',
    assignedDepartment: 'Admissions',
    status: 'CONFIRMED',
    meetingLinkOrVenue,
    createdAt: new Date().toISOString(),
  };

  if (!db.appointments) db.appointments = [];
  db.appointments.unshift(newAppointment);

  // Also log confirmation message
  if (!db.messages) db.messages = [];
  db.messages.unshift({
    id: `MSG-${Date.now().toString().slice(-4)}`,
    type: 'whatsapp',
    recipient: params.mobile,
    templateId: params.mode === 'campus_visit' ? 'visit_ticket_confirmation' : 'appointment_confirmation',
    content: params.mode === 'campus_visit'
      ? `Dear ${params.name}, your Campus Visit ticket ${id} is confirmed. Visiting hours: Monday to Friday 8:30 AM to 5:00 PM.`
      : `Dear ${params.name}, your online consultation ${id} with Admissions is confirmed for ${finalDate} at ${finalTime}. Our Admissions team will contact you 1 minute before the allocated time and you will receive a WhatsApp notification confirming your ticket initiation and request.`,
    status: 'DELIVERED',
    timestamp: new Date().toISOString(),
  });

  writeDB(db);
  return { success: true, appointment: newAppointment, slot: bookedSlot };
}
