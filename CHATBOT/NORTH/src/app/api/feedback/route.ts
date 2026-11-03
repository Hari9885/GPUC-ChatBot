import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inquiryId, rating, comment } = body;

    const db = readDB();
    const fbId = `FB-${Date.now().toString().slice(-4)}`;
    db.feedback.unshift({
      id: fbId,
      inquiryId,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    });

    writeDB(db);
    return NextResponse.json({ success: true, feedbackId: fbId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
