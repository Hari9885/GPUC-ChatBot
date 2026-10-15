import { NextRequest, NextResponse } from 'next/server';
import {
  readDB,
  writeDB,
  getTomorrowDateString,
  checkSlotAvailability,
  getNextAvailableSlot,
  bookAppointment,
  normalizeTime,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = readDB();
    const url = new URL(req.url);
    const tomorrowDate = getTomorrowDateString();

    // Check specific slot availability if queried
    const queryDate = url.searchParams.get('date');
    const queryTime = url.searchParams.get('time');

    if (queryDate && queryTime) {
      const check = checkSlotAvailability(db, queryDate, queryTime, 'Admissions');
      const nextSlot = !check.available
        ? getNextAvailableSlot(db, queryDate, queryTime, 'Admissions')
        : null;

      return NextResponse.json({
        available: check.available,
        slot: check.slot,
        reason: check.reason,
        nextAvailableSlot: nextSlot,
      });
    }

    // Check tomorrow 9:00 AM specifically
    const tomorrow9AmCheck = checkSlotAvailability(db, tomorrowDate, '09:00 AM', 'Admissions');
    const nextAfterTomorrow9Am = !tomorrow9AmCheck.available
      ? getNextAvailableSlot(db, tomorrowDate, '09:00 AM', 'Admissions')
      : null;

    const availableSlots = db.slots
      .filter((s) => !s.isBooked && s.department.toLowerCase().includes('admissions'))
      .slice(0, 8);

    return NextResponse.json({
      appointments: db.appointments,
      slots: db.slots,
      tomorrowDate,
      isTomorrow9AmAvailable: tomorrow9AmCheck.available,
      tomorrowSlot: tomorrow9AmCheck.slot,
      nextAvailableSlot: nextAfterTomorrow9Am,
      availableSlots,
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
