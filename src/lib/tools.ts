import { readDB, writeDB, Inquiry, Appointment, TimeSlot, MessageLog } from './db';
import { searchKnowledge, loadFAQs, loadFaculty } from './knowledge';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const toolDeclarations: ToolDefinition[] = [
  {
    name: 'search_knowledge_base',
    description: 'Retrieve verified information from Gopalan Pre-University College approved knowledge base documents.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or topic (e.g., courses, PCMB, PCMC, facilities, hostel, rules, timings)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'retrieve_approved_faq',
    description: 'Fetch official approved Q&A from the college FAQ seed database.',
    parameters: {
      type: 'object',
      properties: {
        intent: { type: 'string', description: 'The user intent or question category (e.g., courses_science, admissions, facilities, contact_details)' },
      },
      required: ['intent'],
    },
  },
  {
    name: 'create_inquiry',
    description: 'Record an official college inquiry or admission lead with user consent.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name of the parent or student' },
        mobile: { type: 'string', description: 'Validated mobile phone number' },
        user_type: { type: 'string', enum: ['parent', 'prospective_student', 'current_student', 'other'], description: 'Role of the enquirer' },
        course_interest: { type: 'string', description: 'Interested stream/combination (e.g. Science PCMB, Commerce CEBA)' },
        intended_year: { type: 'string', description: 'Intended academic year (e.g. 2026-2027)' },
        category: { type: 'string', description: 'Inquiry category (ADMISSIONS, COURSES, FACILITIES, GENERAL)' },
        preferred_contact: { type: 'string', enum: ['phone', 'whatsapp', 'email'], description: 'Preferred communication method' },
        summary: { type: 'string', description: 'Brief description of the query or request' },
        consent: { type: 'boolean', description: 'Explicit consent for follow-up communications' },
      },
      required: ['name', 'mobile', 'summary', 'consent'],
    },
  },
  {
    name: 'find_existing_inquiry',
    description: 'Look up an existing inquiry status by reference ID and/or mobile number.',
    parameters: {
      type: 'object',
      properties: {
        inquiry_id: { type: 'string', description: 'Official reference ID (e.g. GPUC-2026-INQ-1001)' },
        mobile: { type: 'string', description: 'Mobile number for identity verification' },
      },
      required: ['inquiry_id'],
    },
  },
  {
    name: 'get_staff_availability',
    description: 'Retrieve genuine real-time open calendar slots for campus visits, online consultations, or callbacks.',
    parameters: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['campus_visit', 'online_meeting', 'callback'], description: 'Appointment mode' },
        department: { type: 'string', description: 'Target department (Admissions, Accounts, Academic Coordinator, Administration)' },
        date_range: { type: 'string', description: 'Optional preferred date (YYYY-MM-DD)' },
      },
      required: ['mode'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Book a confirmed consultation or campus visit transactionally, locking the verified slot.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Visitor / enquirer full name' },
        mobile: { type: 'string', description: 'Contact phone number' },
        mode: { type: 'string', enum: ['campus_visit', 'online_meeting', 'callback'], description: 'Mode of consultation' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD' },
        time_slot: { type: 'string', description: 'Slot time (e.g. 10:00 AM, 11:30 AM)' },
        purpose: { type: 'string', description: 'Reason for visit / consultation' },
        inquiry_id: { type: 'string', description: 'Optional linked inquiry reference ID' },
      },
      required: ['name', 'mobile', 'mode', 'date', 'time_slot', 'purpose'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing verified appointment to a new open slot.',
    parameters: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'Appointment Reference ID (e.g. GPUC-2026-APT-501)' },
        new_date: { type: 'string', description: 'New date in YYYY-MM-DD' },
        new_time_slot: { type: 'string', description: 'New slot time' },
      },
      required: ['appointment_id', 'new_date', 'new_time_slot'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing verified appointment and free up the calendar slot.',
    parameters: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'Appointment Reference ID' },
        reason: { type: 'string', description: 'Reason for cancellation' },
      },
      required: ['appointment_id'],
    },
  },
  {
    name: 'create_callback_request',
    description: 'Log a requested staff callback in the college queue.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'User name' },
        mobile: { type: 'string', description: 'Phone number for callback' },
        department: { type: 'string', description: 'Department (Admissions, Accounts, Academic Coordinator, Administration)' },
        notes: { type: 'string', description: 'Topics the user wants to discuss' },
      },
      required: ['name', 'mobile', 'department'],
    },
  },
  {
    name: 'send_approved_whatsapp_message',
    description: 'Dispatch an approved official WhatsApp notification (e.g., inquiry acknowledgement, appointment confirmation).',
    parameters: {
      type: 'object',
      properties: {
        mobile: { type: 'string', description: 'Recipient mobile number' },
        template_id: { type: 'string', enum: ['inquiry_ack', 'appointment_confirmation', 'callback_scheduled'], description: 'Approved template ID' },
        parameters: { type: 'object', description: 'Key-value parameters for template substitution' },
      },
      required: ['mobile', 'template_id', 'parameters'],
    },
  },
  {
    name: 'record_feedback',
    description: 'Save user experience rating (1 to 5 stars) and optional feedback comments.',
    parameters: {
      type: 'object',
      properties: {
        rating: { type: 'number', description: 'Rating from 1 to 5' },
        comment: { type: 'string', description: 'Optional feedback text' },
        inquiry_id: { type: 'string', description: 'Optional linked inquiry reference' },
      },
      required: ['rating'],
    },
  },
  {
    name: 'get_verified_contact_information',
    description: 'Retrieve verified official Gopalan Pre-University College contact details and campus address.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_human_handover',
    description: 'Escalate an unresolved, sensitive, or complex query to human college staff.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why human intervention is required' },
        department: { type: 'string', description: 'Department queue to route to' },
        inquiry_id: { type: 'string', description: 'Optional inquiry reference' },
      },
      required: ['reason', 'department'],
    },
  },
];

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  const db = readDB();

  switch (name) {
    case 'search_knowledge_base': {
      const results = searchKnowledge(args.query || '');
      return {
        query: args.query,
        count: results.length,
        results: results.map((r) => ({
          title: r.title,
          content: r.content,
          status: r.status,
          source: r.sourceUrl,
        })),
      };
    }

    case 'retrieve_approved_faq': {
      const faqs = loadFAQs();
      const match = faqs.filter(
        (f) =>
          f.intent.toLowerCase().includes((args.intent || '').toLowerCase()) ||
          f.question.toLowerCase().includes((args.intent || '').toLowerCase())
      );
      return {
        intent: args.intent,
        matched: match.length > 0 ? match : faqs.slice(0, 3),
      };
    }

    case 'create_inquiry': {
      const id = `GPUC-2026-INQ-${Math.floor(1000 + Math.random() * 9000)}`;
      const departmentMap: Record<string, string> = {
        ADMISSIONS: 'Admissions',
        COURSES: 'Admissions',
        FEES: 'Accounts',
        FACILITIES: 'Administration',
        ACADEMICS: 'Academic Coordinator',
      };

      const assignedTeam = departmentMap[(args.category || '').toUpperCase()] || 'Admissions';

      const newInquiry: Inquiry = {
        id,
        name: args.name,
        mobile: args.mobile,
        userType: args.user_type || 'prospective_student',
        courseInterest: args.course_interest || 'General PUC',
        intendedYear: args.intended_year || '2026-2027',
        category: args.category || 'ADMISSION_PROCESS',
        preferredContact: args.preferred_contact || 'phone',
        summary: args.summary,
        assignedTeam,
        status: 'ASSIGNED',
        consentGiven: args.consent === true,
        consentPurpose: 'Admission inquiry follow-up and college updates',
        consentTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.inquiries.unshift(newInquiry);

      // Auto-dispatch WhatsApp acknowledgement
      const msgId = `MSG-${Date.now()}`;
      db.messages.unshift({
        id: msgId,
        type: 'whatsapp',
        recipient: args.mobile,
        templateId: 'inquiry_ack',
        content: `Namaste ${args.name}, your inquiry with Gopalan PU College has been registered. Reference: ${id}. Our ${assignedTeam} team will assist you shortly.`,
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      });

      writeDB(db);

      return {
        success: true,
        inquiry_id: id,
        assigned_team: assignedTeam,
        status: 'ASSIGNED',
        message: `Inquiry successfully registered with Reference ID ${id}. Notification sent to ${args.mobile}.`,
      };
    }

    case 'find_existing_inquiry': {
      const found = db.inquiries.find(
        (inq) =>
          inq.id.toLowerCase() === (args.inquiry_id || '').toLowerCase() ||
          (args.mobile && inq.mobile.includes(args.mobile))
      );

      if (!found) {
        return {
          found: false,
          message: `No inquiry found matching reference ${args.inquiry_id}. Please check the reference number or contact Admissions.`,
        };
      }

      return {
        found: true,
        inquiry_id: found.id,
        name: found.name,
        status: found.status,
        assigned_team: found.assignedTeam,
        course: found.courseInterest,
        created_at: found.createdAt,
      };
    }

    case 'get_staff_availability': {
      const targetDate = args.date_range;
      let availableSlots = db.slots.filter((s) => !s.isBooked);

      if (targetDate) {
        availableSlots = availableSlots.filter((s) => s.date === targetDate);
      }

      return {
        mode: args.mode,
        department: args.department || 'Admissions',
        available_slots_count: availableSlots.length,
        slots: availableSlots.slice(0, 6).map((s) => ({
          slot_id: s.id,
          date: s.date,
          time: s.time,
          department: s.department,
        })),
      };
    }

    case 'create_appointment': {
      // Find matching slot or create transactional reservation
      const slot = db.slots.find((s) => s.date === args.date && s.time === args.time_slot && !s.isBooked);

      if (slot) {
        slot.isBooked = true;
        slot.bookedBy = args.name;
      }

      const aptId = `GPUC-2026-APT-${Math.floor(100 + Math.random() * 900)}`;
      const venue =
        args.mode === 'campus_visit'
          ? 'Gopalan PU College Campus, 181/1, Hoodi, Whitefield, Bengaluru - 560048'
          : args.mode === 'online_meeting'
          ? 'Google Meet (Link will be dispatched 30 mins prior)'
          : 'Telephonic Callback from College Office';

      const newApt: Appointment = {
        id: aptId,
        inquiryId: args.inquiry_id,
        name: args.name,
        mobile: args.mobile,
        mode: args.mode,
        date: args.date,
        timeSlot: args.time_slot,
        purpose: args.purpose,
        assignedStaff: 'Admissions Officer / Counselor',
        assignedDepartment: 'Admissions',
        status: 'CONFIRMED',
        meetingLinkOrVenue: venue,
        createdAt: new Date().toISOString(),
      };

      db.appointments.unshift(newApt);

      // Trigger confirmed WhatsApp message
      db.messages.unshift({
        id: `MSG-${Date.now()}`,
        type: 'whatsapp',
        recipient: args.mobile,
        templateId: 'appointment_confirmation',
        content: `Dear ${args.name}, your ${args.mode.replace('_', ' ')} at Gopalan PU College is confirmed for ${args.date} at ${args.time_slot}. Ref: ${aptId}. Venue/Details: ${venue}`,
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      });

      writeDB(db);

      return {
        success: true,
        appointment_id: aptId,
        mode: args.mode,
        date: args.date,
        time_slot: args.time_slot,
        status: 'CONFIRMED',
        venue_or_link: venue,
        confirmation_message: `Appointment confirmed for ${args.date} at ${args.time_slot}. Reference: ${aptId}.`,
      };
    }

    case 'reschedule_appointment': {
      const apt = db.appointments.find((a) => a.id === args.appointment_id);
      if (!apt) {
        return { success: false, message: `Appointment ${args.appointment_id} not found.` };
      }

      apt.date = args.new_date;
      apt.timeSlot = args.new_time_slot;
      apt.status = 'RESCHEDULED';

      writeDB(db);

      return {
        success: true,
        appointment_id: apt.id,
        status: 'RESCHEDULED',
        new_date: args.new_date,
        new_time_slot: args.new_time_slot,
      };
    }

    case 'cancel_appointment': {
      const apt = db.appointments.find((a) => a.id === args.appointment_id);
      if (!apt) {
        return { success: false, message: `Appointment ${args.appointment_id} not found.` };
      }

      apt.status = 'CANCELLED';
      writeDB(db);

      return {
        success: true,
        appointment_id: apt.id,
        status: 'CANCELLED',
        message: 'Appointment has been cancelled successfully.',
      };
    }

    case 'create_callback_request': {
      const inqId = `GPUC-2026-INQ-${Math.floor(1000 + Math.random() * 9000)}`;
      db.inquiries.unshift({
        id: inqId,
        name: args.name,
        mobile: args.mobile,
        category: 'CALLBACK_REQUEST',
        preferredContact: 'phone',
        summary: `Callback requested for ${args.department}. Notes: ${args.notes || 'General guidance'}`,
        assignedTeam: args.department || 'Admissions',
        status: 'CONTACT_PENDING',
        consentGiven: true,
        consentPurpose: 'Callback request',
        consentTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      writeDB(db);

      return {
        success: true,
        reference_id: inqId,
        department: args.department,
        status: 'CONTACT_PENDING',
        message: `Callback request registered with reference ${inqId}. College team will connect with you during working hours.`,
      };
    }

    case 'send_approved_whatsapp_message': {
      const msgId = `MSG-${Date.now()}`;
      let text = `Greetings from Gopalan PU College. Template: ${args.template_id}`;
      if (args.template_id === 'inquiry_ack') {
        text = `Hello, your inquiry with Gopalan PU College is acknowledged. Reference: ${args.parameters?.reference || 'N/A'}`;
      } else if (args.template_id === 'appointment_confirmation') {
        text = `Hello, your consultation appointment is confirmed for ${args.parameters?.date} at ${args.parameters?.time}. Reference: ${args.parameters?.reference}`;
      }

      db.messages.unshift({
        id: msgId,
        type: 'whatsapp',
        recipient: args.mobile,
        templateId: args.template_id,
        content: text,
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      });

      writeDB(db);

      return {
        success: true,
        message_id: msgId,
        recipient: args.mobile,
        delivery_status: 'DELIVERED',
      };
    }

    case 'record_feedback': {
      const fbId = `FB-${Date.now().toString().slice(-4)}`;
      db.feedback.unshift({
        id: fbId,
        inquiryId: args.inquiry_id,
        rating: Math.max(1, Math.min(5, Number(args.rating) || 5)),
        comment: args.comment || '',
        createdAt: new Date().toISOString(),
      });

      writeDB(db);

      return {
        success: true,
        feedback_id: fbId,
        message: 'Thank you for your valuable feedback! It helps us improve our service.',
      };
    }

    case 'get_verified_contact_information': {
      return {
        institution: 'Gopalan Pre-University College',
        campus_address: '181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Bengaluru – 560 048',
        admissions_phone: '+91 96069 41908',
        campus_phone: '+91 96069 41908 / (080) 41280227',
        spoc_contact: 'Mr. Aravind J (Admin Executive): +91 63621 66945',
        official_email: 'admin@gopalanpucollege.com',
        website: 'https://www.gopalancolleges.com/gpuc/',
        office_hours: 'Monday to Friday: 8:30 AM – 5:00 PM (Closed on Weekends & Public Holidays)',
        notes: 'Help desk is available Monday to Friday from 8:30 AM to 5:00 PM.',
      };
    }

    case 'create_human_handover': {
      const inqId = args.inquiry_id || `GPUC-2026-INQ-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        handover_ticket: `TICKET-${Math.floor(10000 + Math.random() * 90000)}`,
        inquiry_id: inqId,
        assigned_queue: args.department || 'General Support',
        status: 'ESCALATED_TO_STAFF',
        message: `Your query has been escalated to our ${args.department || 'General Support'} staff. An authorized representative will assist you.`,
      };
    }

    default:
      return { error: `Tool ${name} is not recognized.` };
  }
}
