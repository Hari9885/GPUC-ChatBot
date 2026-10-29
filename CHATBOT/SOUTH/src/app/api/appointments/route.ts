import { NextRequest, NextResponse } from 'next/server';
import {
  readDB,
  writeDB,
  getTomorrowDateString,
  getAvailableWorkingDays,
  getNext3Days,
  checkSlotAvailability,
  getNextAvailableSlot,
  bookAppointment,
  normalizeTime,
} from '@/lib/db';
import { validatePersonName, validateIndianMobile, getTodayDateString } from '@/lib/textUtils';

export async function GET(req: NextRequest) {
  try {
    const db = readDB();
    const url = new URL(req.url);
    const workingDays = getAvailableWorkingDays();
    const next3Days = workingDays.slice(0, 3);
    const defaultDate = workingDays[0]?.dateStr || getTodayDateString();

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
        workingDays,
        next3Days,
        defaultDate,
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
        workingDays,
        next3Days,
        selectedDate: queryDate,
        defaultDate,
      });
    }

    // Default: return all working days slots and default date slots
    const workingDates = workingDays.map((d) => d.dateStr);
    const defaultDateSlots = sortSlotsChronologically(
      db.slots.filter(
        (s) => s.date === defaultDate && !s.isBooked && s.department.toLowerCase().includes('admissions')
      )
    );
    const allWorkingDaysSlots = sortSlotsChronologically(
      db.slots.filter(
        (s) => workingDates.includes(s.date) && !s.isBooked && s.department.toLowerCase().includes('admissions')
      )
    );

    return NextResponse.json({
      workingDays,
      next3Days,
      defaultDate,
      availableSlotsForDate: defaultDateSlots,
      availableSlots: allWorkingDaysSlots,
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

    const studentNameInput = (body.studentName || '').trim();
    const parentNameInput = (body.parentName || '').trim();
    const rawName = (name || studentNameInput || '').trim();
    const rawMobile = (mobile || '').trim();

    if (!rawName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Handle names formatted with parent information, e.g. "Student Name (Parent: Parent Name)"
    let studentPart = rawName;
    let parentPart = parentNameInput;

    const parentMatch = rawName.match(/^(.*?)\s*\((?:Parent:\s*)?([^)]+)\)$/i);
    if (parentMatch) {
      studentPart = parentMatch[1].trim();
      if (!parentPart) {
        parentPart = parentMatch[2].trim();
      }
    }

    const studentValidation = validatePersonName(studentPart);
    if (!studentValidation.valid) {
      return NextResponse.json({ error: studentValidation.error || 'Letters only' }, { status: 400 });
    }

    if (parentPart) {
      const parentValidation = validatePersonName(parentPart);
      if (!parentValidation.valid) {
        return NextResponse.json({ error: parentValidation.error || 'Letters only' }, { status: 400 });
      }
    }

    const cleanFullName = parentPart
      ? `${studentValidation.cleanName} (Parent: ${parentPart})`
      : studentValidation.cleanName;

    const mobileValidation = validateIndianMobile(rawMobile);
    if (!mobileValidation.valid) {
      return NextResponse.json({ error: mobileValidation.error || 'Mobile number must start with 6, 7, 8, or 9.' }, { status: 400 });
    }

    let finalDate = (date || '').trim();
    const dateInTime = timeSlot ? timeSlot.match(/\b(20\d\d-[0-1]\d-[0-3]\d)\b/) : null;
    if (!finalDate && dateInTime) {
      finalDate = dateInTime[1];
    }

    const db = readDB();
    const finalMode: 'campus_visit' | 'online_meeting' =
      mode === 'online_meeting' ? 'online_meeting' : 'campus_visit';

    // If online meeting, verify availability if date and time provided
    if (finalMode === 'online_meeting') {
      const workingDays = getAvailableWorkingDays();
      const checkDate = finalDate || workingDays[0]?.dateStr || getTodayDateString();
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
      name: cleanFullName,
      mobile: mobileValidation.formatted,
      mode: finalMode,
      date: finalDate || undefined,
      timeSlot: timeSlot ? normalizeTime(timeSlot) : undefined,
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
