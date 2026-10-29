import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, Inquiry, writeAnalysisDB, UserQueryLog } from '@/lib/db';
import { validatePersonName, validateIndianMobile } from '@/lib/textUtils';
import { pushInquiry } from '@/lib/hub';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName,
      parentName,
      mobile,
      location,
      admissionClass,
      inquiryType,
      queryTopic,
      chatNotes,
      department,
      staff,
    } = body;

    const rawName = (studentName || body.name || '').trim();
    const rawMobile = (mobile || '').trim();

    // Minimum requirement validation: Student Name and Mobile
    const studentVal = validatePersonName(rawName);
    if (!studentVal.valid) {
      return NextResponse.json({ error: studentVal.error || 'Letters only' }, { status: 400 });
    }

    const finalParent = (parentName || '').trim();
    if (finalParent) {
      const parentVal = validatePersonName(finalParent);
      if (!parentVal.valid) {
        return NextResponse.json({ error: parentVal.error || 'Letters only' }, { status: 400 });
      }
    }

    const mobileVal = validateIndianMobile(rawMobile);
    if (!mobileVal.valid) {
      return NextResponse.json({ error: mobileVal.error || 'Mobile number must start with 6, 7, 8, or 9.' }, { status: 400 });
    }

    const db = readDB();
    const refNum = (1000 + db.inquiries.length + 1).toString();
    const id = `GPUC-2026-INQ-${refNum}`;

    const finalLocation = (location || '').trim();
    const fullName = finalParent ? `${studentVal.cleanName} (Parent: ${finalParent})` : studentVal.cleanName;
    const finalClass = admissionClass || '12th Class (2nd PU) / 11th Class';
    const finalType = inquiryType || 'Admissions';
    const finalTopic = queryTopic || 'College Information';

    // Intelligent Department & Staff Incharge Routing
    const combinedContent = `${finalTopic} ${finalType} ${finalLocation} ${chatNotes || ''}`.toLowerCase();

    let assignedTeam = department || 'Admissions';
    let assignedStaff = staff || 'Mr. Aravind J (Admissions Officer)';
    let category = finalType.toUpperCase().replace(/\s+/g, '_');

    if (!department) {
      if (
        combinedContent.includes('fee') ||
        combinedContent.includes('cost') ||
        combinedContent.includes('tuition') ||
        combinedContent.includes('scholarship') ||
        combinedContent.includes('installment') ||
        combinedContent.includes('concession') ||
        combinedContent.includes('payment') ||
        combinedContent.includes('account') ||
        combinedContent.includes('refund') ||
        combinedContent.includes('challan') ||
        combinedContent.includes('demand draft') ||
        combinedContent.includes('finance')
      ) {
        assignedTeam = 'Accounts';
        assignedStaff = 'Mrs. Kavitha N (Accountant)';
        category = 'FEES_AND_SCHOLARSHIPS';
      } else if (
        combinedContent.includes('campus visit') ||
        combinedContent.includes('visit') ||
        combinedContent.includes('hostel') ||
        combinedContent.includes('bus') ||
        combinedContent.includes('transport') ||
        combinedContent.includes('infrastructure') ||
        combinedContent.includes('facility') ||
        combinedContent.includes('mess') ||
        combinedContent.includes('principal') ||
        combinedContent.includes('appointment')
      ) {
        assignedTeam = 'Administration';
        assignedStaff = 'Mr. Suresh Kumar (Administration Officer)';
        category = 'CAMPUS_ADMINISTRATION';
      } else if (
        combinedContent.includes('neet') ||
        combinedContent.includes('jee') ||
        combinedContent.includes('kcet') ||
        combinedContent.includes('coaching') ||
        combinedContent.includes('faculty') ||
        combinedContent.includes('lecturer') ||
        combinedContent.includes('timetable')
      ) {
        assignedTeam = 'Academics';
        assignedStaff = 'Mrs. Deepa R (Academic Coordinator)';
        category = 'ACADEMICS_AND_COACHING';
      } else {
        assignedTeam = 'Admissions';
        assignedStaff = 'Mr. Aravind J (Admissions Officer)';
        category = 'ADMISSIONS_2026-27';
      }
    }

    const newInquiry: Inquiry = {
      id,
      name: fullName,
      mobile: mobileVal.formatted,
      parentName: finalParent || undefined,
      location: finalLocation || undefined,
      userType: finalParent ? 'parent' : 'prospective_student',
      courseInterest: finalClass,
      intendedYear: '2027-2028',
      category,
      preferredContact: 'phone',
      summary: `Topic: ${finalTopic} | Class: ${finalClass} | Inquiry: ${finalType} | Student: ${studentVal.cleanName}${finalParent ? ` | Parent: ${finalParent}` : ''}${finalLocation ? ` | Location: ${finalLocation}` : ''}${chatNotes ? ` | Note: ${chatNotes}` : ''}`,
      assignedTeam,
      assignedStaff,
      status: 'NEW',
      consentGiven: true,
      consentPurpose: 'Inquiry guidance and admission assistance',
      consentTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.inquiries.unshift(newInquiry);
    writeDB(db);

    // Mirror this enquiry to the Central Admission Hub (no-op unless HUB_* env vars are set).
    void pushInquiry(newInquiry);

    // Save session queries to dedicated analytics JSON for algorithm improvement ONLY when phone number is provided
    if (rawMobile) {
      const queriesList: UserQueryLog[] = Array.isArray(body.sessionQueries) ? body.sessionQueries : [];
      writeAnalysisDB({
        analysisId: `ANL-2026-${refNum}`,
        inquiryId: id,
        timestamp: new Date().toISOString(),
        studentName: rawName,
        parentName: finalParent || undefined,
        mobile: rawMobile,
        location: finalLocation || undefined,
        admissionClass: finalClass,
        totalQueries: queriesList.length,
        queries: queriesList,
        leadSource: body.leadSource || 'chatbot_inquiry_wizard',
      });
    }

    return NextResponse.json({ success: true, inquiry: newInquiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Public: the widget only appends notes to its own lead, so never return the lead.
// ponytail: ids are sequential, so anyone can append notes to any lead; switch to random ids if abused.
export async function PATCH(req: NextRequest) {
  try {
    const { id, notes, chatInfo } = await req.json();

    const db = readDB();
    const inq = db.inquiries.find((i) => i.id === id);
    if (!inq) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    if (notes) inq.summary += ` | Note: ${notes}`;
    if (chatInfo) inq.summary += ` | Chat update: ${chatInfo}`;
    inq.updatedAt = new Date().toISOString();

    writeDB(db);
    void pushInquiry(inq); // status/notes change -> the hub updates the same lead
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
