import fs from 'fs';
import path from 'path';

export interface Inquiry {
  id: string;
  name: string;
  mobile: string;
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

function initializeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM'];
  const today = new Date();

  // Generate slots for the next 7 business days
  for (let d = 1; d <= 7; d++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + d);
    if (nextDate.getDay() === 0) continue; // Skip Sunday

    const dateStr = nextDate.toISOString().split('T')[0];

    times.forEach((time, idx) => {
      slots.push({
        id: `slot_${dateStr}_${idx}`,
        date: dateStr,
        time,
        department: idx % 2 === 0 ? 'Admissions' : 'Academic Coordinator',
        mode: 'all',
        isBooked: false,
      });
    });
  }
  return slots;
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
    return JSON.parse(raw);
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
