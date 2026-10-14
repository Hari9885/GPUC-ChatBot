import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, Inquiry } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = readDB();
    const url = new URL(req.url);
    const department = url.searchParams.get('department');
    const status = url.searchParams.get('status');

    let list = db.inquiries;
    if (department && department !== 'All') {
      list = list.filter((i) => i.assignedTeam.toLowerCase() === department.toLowerCase());
    }
    if (status && status !== 'All') {
      list = list.filter((i) => i.status === status);
    }

    return NextResponse.json({ inquiries: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName,
      parentName,
      mobile,
      admissionClass,
      inquiryType,
      queryTopic,
      chatNotes,
    } = body;

    const rawName = (studentName || body.name || '').trim();
    const rawMobile = (mobile || '').trim();

    // Minimum requirement validation: Student Name and Mobile
    if (!rawName) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
    }
    if (!rawMobile || rawMobile.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const db = readDB();
    const refNum = (1000 + db.inquiries.length + 1).toString();
    const id = `GPUC-2026-INQ-${refNum}`;

    const finalParent = (parentName || '').trim();
    const fullName = finalParent ? `${rawName} (Parent: ${finalParent})` : rawName;
    const finalClass = admissionClass || '12th Class (2nd PU) / 11th Class';
    const finalType = inquiryType || 'Admissions';
    const finalTopic = queryTopic || 'College Information';

    const newInquiry: Inquiry = {
      id,
      name: fullName,
      mobile: rawMobile,
      userType: finalParent ? 'parent' : 'prospective_student',
      courseInterest: finalClass,
      intendedYear: '2026-2027',
      category: finalType.toUpperCase().replace(/\s+/g, '_'),
      preferredContact: 'phone',
      summary: `Topic: ${finalTopic} | Class: ${finalClass} | Inquiry: ${finalType} | Student: ${rawName}${finalParent ? ` | Parent: ${finalParent}` : ''}${chatNotes ? ` | Note: ${chatNotes}` : ''}`,
      assignedTeam: finalType.toLowerCase().includes('campus') ? 'Administration' : 'Admissions',
      assignedStaff: 'Mr. Aravind J',
      status: 'NEW',
      consentGiven: true,
      consentPurpose: 'Inquiry guidance and admission assistance',
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.inquiries.unshift(newInquiry);
    writeDB(db);

    return NextResponse.json({ success: true, inquiry: newInquiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, assignedTeam, notes, chatInfo } = body;

    const db = readDB();
    const inq = db.inquiries.find((i) => i.id === id);
    if (!inq) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    if (status) inq.status = status;
    if (assignedTeam) inq.assignedTeam = assignedTeam;
    if (notes) inq.summary += ` | Note: ${notes}`;
    if (chatInfo) inq.summary += ` | Chat update: ${chatInfo}`;
    inq.updatedAt = new Date().toISOString();

    writeDB(db);
    return NextResponse.json({ success: true, inquiry: inq });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
