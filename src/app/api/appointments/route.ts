import { NextRequest, NextResponse } from 'next/server';
import {
  readDB,
  writeDB,
  getTomorrowDateString,
  getNext3Days,
  checkSlotAvailability,
  getNextAvailableSlot,
  bookAppointment,
  normalizeTime,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = readDB();
    const url = new URL(req.url);
    const next3Days = getNext3Days();
    const defaultDate = next3Days[0]?.dateStr || getTomorrowDateString();

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = (match[3] || 'AM').toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function sortSlotsChronologically<T extends { time: string }>(slots: T[]): T[] {
  return [...slots].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
}

    const queryDate = url.searchParams.get('date');
    const queryTime = url.searchParams.get('time');

    if (queryDate && queryTime) {
      const check = checkSlotAvailability(db, queryDate, queryTime, 'Admissions');
      const nextSlot = !check.available
        ? getNextAvailableSlot(db, queryDate, queryTime, 'Admissions')
        : null;

      const dateSlots = sortSlotsChronologically(
        db.slots.filter(
          (s) => s.date === queryDate && !s.isBooked && s.department.toLowerCase().includes('admissions')
        )
      );

      return NextResponse.json({
        available: check.available,
        slot: check.slot,
        reason: check.reason,
        nextAvailableSlot: nextSlot,
        availableSlotsForDate: dateSlots,
        next3Days,
      });
    }

    if (queryDate && !queryTime) {
      const dateSlots = sortSlotsChronologically(
        db.slots.filter(
          (s) => s.date === queryDate && !s.isBooked && s.department.toLowerCase().includes('admissions')
        )
      );
      return NextResponse.json({
        availableSlotsForDate: dateSlots,
        next3Days,
        selectedDate: queryDate,
      });
    }

    // Default: return next 3 days and available slots for day 1 as well as all 3 days
    const next3Dates = next3Days.map((d) => d.dateStr);
    const defaultDateSlots = sortSlotsChronologically(
      db.slots.filter(
        (s) => s.date === defaultDate && !s.isBooked && s.department.toLowerCase().includes('admissions')
      )
    );
    const all3DaysSlots = sortSlotsChronologically(
      db.slots.filter(
        (s) => next3Dates.includes(s.date) && !s.isBooked && s.department.toLowerCase().includes('admissions')
      )
    );

    return NextResponse.json({
      next3Days,
      defaultDate,
      availableSlotsForDate: defaultDateSlots,
      availableSlots: all3DaysSlots,
      appointments: db.appointments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile, mode, date, timeSlot, purpose, inquiryId } = body;

    const rawName = (name || '').trim();
    const rawMobile = (mobile || '').trim();

    if (!rawName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!rawMobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const db = readDB();
    const finalMode: 'campus_visit' | 'online_meeting' =
      mode === 'online_meeting' ? 'online_meeting' : 'campus_visit';

    // If online meeting, verify availability if date and time provided
    if (finalMode === 'online_meeting') {
      const checkDate = date || getTomorrowDateString();
      const checkTime = timeSlot ? normalizeTime(timeSlot) : '09:00 AM';
      const check = checkSlotAvailability(db, checkDate, checkTime, 'Admissions');

      if (!check.available && check.slot?.isBooked) {
        const nextSlot = getNextAvailableSlot(db, checkDate, checkTime, 'Admissions');
        return NextResponse.json(
          {
            error: 'Selected time slot is already booked',
            available: false,
            nextAvailableSlot: nextSlot,
          },
          { status: 409 }
        );
      }
    }

    const result = bookAppointment(db, {
      name: rawName,
      mobile: rawMobile,
      mode: finalMode,
      date,
      timeSlot,
      purpose,
      inquiryId,
    });

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      slot: result.slot,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    const db = readDB();
    const apt = db.appointments.find((a) => a.id === id);
    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (status) apt.status = status;
    writeDB(db);
    return NextResponse.json({ success: true, appointment: apt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
