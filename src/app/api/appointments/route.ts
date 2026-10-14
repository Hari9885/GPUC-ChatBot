import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = readDB();
    return NextResponse.json({
      appointments: db.appointments,
      slots: db.slots,
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
