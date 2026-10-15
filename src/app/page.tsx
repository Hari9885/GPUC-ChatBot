'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  GraduationCap,
  Calendar,
  CheckCircle,
  Info,
  RotateCcw,
  Sparkles,
  MessageSquare,
  X,
  Minus,
  Maximize2,
  ChevronDown,
  User,
  Users,
  Phone,
  Check,
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  Video,
  ExternalLink,
} from 'lucide-react';
import GpucWebsite from '@/components/GpucWebsite';
import { stripStarsAndAsterisks, enforceMaxThreeLines, formatPhoneNumbers, getTomorrowDateString } from '@/lib/textUtils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  topic?: string;
  step?:
    | 'ask_student_name'
    | 'ask_contact'
    | 'ask_admission'
    | 'offer_visit_or_online'
    | 'ask_tomorrow_9am'
    | 'choose_custom_slot'
    | 'offer_next_slot'
    | 'completed';
  leadInquiryId?: string;
  pendingQuery?: string;
  ticketData?: {
    id: string;
    mode: 'campus_visit' | 'online_meeting';
    date: string;
    timeSlot: string;
    venue: string;
    studentName: string;
    mobile: string;
    instructions?: string;
  };
  slotOffer?: {
    date: string;
    time: string;
    formatted: string;
  };
  availableSlotsList?: Array<{ date: string; time: string; department: string }>;
  toolCalls?: Array<{ tool: string; args: any; result: any }>;
}

export interface UserLead {
  inquiryId: string;
  studentName: string;
  parentName?: string;
  mobile: string;
  admissionClass: string;
  inquiryType: string;
}

function isGreetingQuery(query: string): boolean {
  const clean = query.trim().toLowerCase().replace(/[!.,?]+$/, '').trim();
  return (
    /^(hi|hello|hey|heyy|heya|hola|namaste|vanakkam|good\s*(morning|afternoon|evening|day)|greetings|howdy)$/i.test(clean) ||
    /^(hi|hello|hey)\s+(there|assistant|bot|gpuc)$/i.test(clean)
  );
}

function isPresetOrResemblingQuery(query: string): boolean {
  if (isGreetingQuery(query)) return false;
  const q = query.toLowerCase().trim();

  // 1. Direct matches with preset FAQs
  const matchesPreset = FAQ_PRESETS.some(
    (p) =>
      p.query.toLowerCase() === q ||
      q.includes(p.query.toLowerCase()) ||
      p.label.toLowerCase().includes(q)
  );
  if (matchesPreset) return true;

  // 2. Resembling queries for courses, admissions, visits, documents, fees
  return (
    /\b(admission|admissions|apply|application|eligib|seat|seats|enrol|enrollment|2026)\b/i.test(q) ||
    /\b(science|commerce|pcmb|pcmc|ceba|seba|meba|stream|streams|combination|combinations|course|courses)\b/i.test(q) ||
    /\b(visit|tour|appointment|consultation|campus visit|offline|online meeting|meeting|schedule)\b/i.test(q) ||
    /\b(document|documents|marks card|marksheet|tc|transfer certificate|certificate|certificates|checklist)\b/i.test(q) ||
    /\b(fee|fees|tuition|cost|scholarship|scholarships)\b/i.test(q)
  );
}

function getTopicFromQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('science') || q.includes('pcmb') || q.includes('pcmc')) {
    return 'Science Stream Combinations (PCMB / PCMC)';
  }
  if (q.includes('commerce') || q.includes('ceba') || q.includes('seba') || q.includes('meba')) {
    return 'Commerce Stream Combinations (CEBA / SEBA / MEBA)';
  }
  if (q.includes('admission') || q.includes('apply') || q.includes('2026') || q.includes('process') || q.includes('eligib')) {
    return 'Admissions for Academic Year 2026–27';
  }
  if (q.includes('visit') || q.includes('tour') || q.includes('consult') || q.includes('appointment')) {
    return 'Campus Visit & Consultation';
  }
  if (q.includes('document') || q.includes('certif') || q.includes('marks card') || q.includes('tc')) {
    return 'Required Documents';
  }
  if (q.includes('facility') || q.includes('hostel') || q.includes('sport') || q.includes('lab') || q.includes('bus') || q.includes('transport')) {
    return 'Campus Facilities & Hostel';
  }
  if (q.includes('contact') || q.includes('phone') || q.includes('address') || q.includes('spoc')) {
    return 'College Contact & Admissions Desk';
  }
  if (q.includes('fee') || q.includes('cost') || q.includes('scholarship') || q.includes('tuition')) {
    return 'Fee Structure & Admissions';
  }
  return 'Admissions & College Information';
}

const FAQ_PRESETS = [
  {
    label: '🎓 Admission for 2026–27',
    query: 'What is the admission process for academic year 2026-2027?',
  },
  {
    label: '🔬 Science (PCMB / PCMC)',
    query: 'What Science combinations are offered at Gopalan PU College?',
  },
  {
    label: '📊 Commerce Streams',
    query: 'What Commerce combinations are offered at Gopalan PU College?',
  },
  {
    label: '📅 Book a Campus Visit',
    query: 'How can I book a campus visit or consultation?',
  },
  {
    label: '📄 Required Documents',
    query: 'Which documents are required for admission?',
  },
];

const INITIAL_GREETING: Message = {
  role: 'assistant',
  content: `Hello! Welcome to Gopalan Pre-University College (GPUC), Bengaluru. 👋

How can I help you today? Please choose an option below or type your question:`,
};

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // User Lead Capture & Step-by-Step Flow ("One question after another")
  const [userLead, setUserLead] = useState<UserLead | null>(null);
  const [leadStep, setLeadStep] = useState<
    'idle' | 'ask_student_name' | 'ask_contact' | 'ask_admission' | 'completed'
  >('idle');
  const [pendingQuery, setPendingQuery] = useState('');
  const [pendingTopic, setPendingTopic] = useState('');

  // Values stored across steps
  const [leadStudentName, setLeadStudentName] = useState('');
  const [leadParentName, setLeadParentName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');

  // Values in current step inputs
  const [stepStudentName, setStepStudentName] = useState('');
  const [stepParentName, setStepParentName] = useState('');
  const [stepMobile, setStepMobile] = useState('');
  const [stepError, setStepError] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Appointment & Meeting Booking Flow State
  const [bookingFlowState, setBookingFlowState] = useState<
    'idle' | 'offered_choice' | 'offered_tomorrow_9am' | 'choosing_custom' | 'offered_next_slot' | 'completed'
  >('idle');
  const [tomorrowDateStr, setTomorrowDateStr] = useState('');
  const [offeredNextSlot, setOfferedNextSlot] = useState<{ date: string; time: string } | null>(null);
  const [availableSlotsList, setAvailableSlotsList] = useState<Array<{ date: string; time: string; department: string }>>([]);
  const [customSlotDate, setCustomSlotDate] = useState('');
  const [customSlotTime, setCustomSlotTime] = useState('10:00 AM');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isTyping, isChatOpen]);

  // Step 1: Submit Student Name (with 1.5s bouncing dots)
  const handleStudentNameSubmit = (nameVal?: string) => {
    const name = (nameVal !== undefined ? nameVal : stepStudentName).trim();
    if (!name) {
      setStepError('Please enter the name of the student.');
      return;
    }
    setStepError('');
    setLeadStudentName(name);
    setStepStudentName('');

    const userMsg: Message = { role: 'user', content: name };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setLeadStep('ask_contact');
      const botMsg: Message = {
        role: 'assistant',
        content: `Thank you, ${name}! Could you please provide the Parent / Guardian Name and Mobile Number?`,
        step: 'ask_contact',
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1500);
  };

  // Step 2: Submit Parent Name & Mobile Number (with 1.5s bouncing dots)
  const handleContactSubmit = (parentVal?: string, mobVal?: string) => {
    const parent = (parentVal !== undefined ? parentVal : stepParentName).trim();
    let mob = (mobVal !== undefined ? mobVal : stepMobile).trim();

    const cleanDigits = mob.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setStepError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setStepError('');
    setLeadParentName(parent);
    setLeadMobile(mob);
    setStepParentName('');
    setStepMobile('');

    const displayUserText = parent
      ? `Parent: ${parent} • Mobile: ${mob}`
      : `Mobile: ${mob}`;
    const userMsg: Message = { role: 'user', content: displayUserText };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setLeadStep('ask_admission');
      const botMsg: Message = {
        role: 'assistant',
        content: `Got it! Is this admission for 12th Class (2nd PU) or 11th Class (1st PU)?`,
        step: 'ask_admission',
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1500);
  };

  // Step 3: Choose Admission Class / Purpose and Submit to Server CRM
  const handleAdmissionSubmit = async (admClass: string, inqType: string) => {
    setStepError('');
    const chosenClass = admClass || '12th Class (2nd PU)';
    const chosenType = inqType || 'Admissions 2026-27';

    const userMsg: Message = {
      role: 'user',
      content: `${chosenClass} • ${chosenType}`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setIsSubmittingLead(true);
    setLoading(true);

    try {
      // Guarantee bouncing dots for at least 1.5 seconds
      const minWaitPromise = new Promise((res) => setTimeout(res, 1500));

      // 1. Submit lead to server CRM
      const leadPromise = fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: leadStudentName,
          parentName: leadParentName,
          mobile: leadMobile,
          admissionClass: chosenClass,
          inquiryType: chosenType,
          queryTopic: pendingTopic || 'College Admissions',
          chatNotes: `Query: ${pendingQuery}`,
        }),
      }).then((r) => r.json());

      // 2. Fetch AI answer from Gemini for the user's specific question
      const chatPromise = fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: pendingQuery || 'Tell me about Gopalan PU College courses and admissions',
            },
          ],
          userContext: {
            studentName: leadStudentName,
            parentName: leadParentName,
            mobile: leadMobile,
            admissionClass: chosenClass,
            inquiryType: chosenType,
          },
        }),
      }).then((r) => r.json());

      const [_, inqData, chatData] = await Promise.all([minWaitPromise, leadPromise, chatPromise]);

      const newInquiryId =
        inqData?.inquiry?.id || `GPUC-2026-INQ-${Date.now().toString().slice(-4)}`;

      const lead: UserLead = {
        inquiryId: newInquiryId,
        studentName: leadStudentName,
        parentName: leadParentName,
        mobile: leadMobile,
        admissionClass: chosenClass,
        inquiryType: chosenType,
      };
      setUserLead(lead);
      setLeadStep('completed');

      const content = enforceMaxThreeLines(chatData?.content || 'I have noted your inquiry.');

      setBookingFlowState('offered_choice');

      const fullContent = `${content}\n\nWould you like to book a campus visit (offline) or request an online meeting?`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fullContent,
          leadInquiryId: newInquiryId,
          step: 'offer_visit_or_online',
          toolCalls: chatData?.toolCalls,
        },
      ]);
    } catch (err) {
      console.error('Lead submission error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Thank you, ${leadStudentName}! I have noted your details.\n\nFor immediate assistance, please call our admissions desk at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM) or email admin@gopalanpucollege.com.`,
        },
      ]);
    } finally {
      setIsTyping(false);
      setIsSubmittingLead(false);
      setLoading(false);
    }
  };

  // Offline Booking: Generate Ticket & Record in Database
  const handleBookOfflineVisit = async () => {
    const currentLead = userLead || {
      inquiryId: 'GPUC-2026-INQ-1001',
      studentName: leadStudentName || 'Prospective Student',
      parentName: leadParentName,
      mobile: leadMobile || '9845012345',
      admissionClass: '12th Class (2nd PU)',
      inquiryType: 'Campus Visit',
    };

    const userMsg: Message = { role: 'user', content: 'Book a Campus Visit (Offline)' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setLoading(true);

    try {
      const minWait = new Promise((res) => setTimeout(res, 1500));
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentLead.studentName + (currentLead.parentName ? ` (Parent: ${currentLead.parentName})` : ''),
          mobile: currentLead.mobile,
          mode: 'campus_visit',
          inquiryId: currentLead.inquiryId,
          purpose: `Campus Visit & Admission Consultation (${currentLead.admissionClass})`,
        }),
      });
      const data = await res.json();
      await minWait;

      const apt = data.appointment || {
        id: `GPUC-VISIT-2026-${Date.now().toString().slice(-4)}`,
        mode: 'campus_visit',
        date: 'Monday to Friday',
        timeSlot: '8:30 AM - 5:00 PM',
        meetingLinkOrVenue: 'Gopalan Pre-University College Campus, 181/1, Hoodi Village, Whitefield, Bengaluru - 560048',
      };

      setBookingFlowState('completed');

      const replyContent = `Your campus visit ticket has been generated and recorded with Reference ${apt.id}.\n\nVisiting hours are Monday to Friday from 8:30 AM to 5:00 PM at our Whitefield campus.`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: enforceMaxThreeLines(replyContent),
          step: 'completed',
          ticketData: {
            id: apt.id,
            mode: 'campus_visit',
            date: apt.date || 'Monday to Friday',
            timeSlot: apt.timeSlot || '8:30 AM - 5:00 PM',
            venue: apt.meetingLinkOrVenue,
            studentName: currentLead.studentName,
            mobile: currentLead.mobile,
            instructions: 'Please present this ticket reference at the Admissions Desk (Block A) upon arrival.',
          },
        },
      ]);
    } catch (err) {
      console.error('Campus visit booking error:', err);
      setBookingFlowState('completed');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Your campus visit has been noted! Please visit our campus from Monday to Friday between 8:30 AM and 5:00 PM.\n\nYou may contact the admissions desk directly at +91 96069 41908.`,
          step: 'completed',
        },
      ]);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Online Meeting: Check Tomorrow 9:00 AM Availability
  const handleInitiateOnlineMeeting = async () => {
    const userMsg: Message = { role: 'user', content: 'Request an Online Meeting' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setLoading(true);

    try {
      const minWait = new Promise((res) => setTimeout(res, 1500));
      const res = await fetch('/api/appointments');
      const data = await res.json();
      await minWait;

      const tDate = data.tomorrowDate || getTomorrowDateString();
      setTomorrowDateStr(tDate);
      setAvailableSlotsList(data.availableSlots || []);

      if (data.isTomorrow9AmAvailable) {
        setBookingFlowState('offered_tomorrow_9am');
        const replyContent = `Our Admissions department has an open slot tomorrow (${tDate}) at 9:00 AM.\n\nWould tomorrow at 9:00 AM be a good time for your online meeting?`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: enforceMaxThreeLines(replyContent),
            step: 'ask_tomorrow_9am',
          },
        ]);
      } else {
        // Tomorrow at 9:00 AM is not available
        setBookingFlowState('choosing_custom');
        const next = data.nextAvailableSlot;
        if (next) setOfferedNextSlot({ date: next.date, time: next.time });

        const replyContent = `Tomorrow at 9:00 AM is currently booked.\n\nPlease enter your preferred date and time, or choose from our available timetable slots:`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: enforceMaxThreeLines(replyContent),
            step: 'choose_custom_slot',
            availableSlotsList: data.availableSlots || [],
          },
        ]);
      }
    } catch (err) {
      console.error('Online meeting check error:', err);
      handleCannotAgreeDeskFallback();
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Confirm Online Meeting for Tomorrow at 9:00 AM
  const handleConfirmTomorrow9Am = async () => {
    const currentLead = userLead || {
      inquiryId: 'GPUC-2026-INQ-1001',
      studentName: leadStudentName || 'Prospective Student',
      parentName: leadParentName,
      mobile: leadMobile || '9845012345',
      admissionClass: '12th Class (2nd PU)',
      inquiryType: 'Online Meeting',
    };

    const userMsg: Message = { role: 'user', content: 'Yes, tomorrow at 9:00 AM works.' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setLoading(true);

    try {
      const minWait = new Promise((res) => setTimeout(res, 1500));
      const targetDate = tomorrowDateStr || getTomorrowDateString();
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentLead.studentName + (currentLead.parentName ? ` (Parent: ${currentLead.parentName})` : ''),
          mobile: currentLead.mobile,
          mode: 'online_meeting',
          date: targetDate,
          timeSlot: '09:00 AM',
          inquiryId: currentLead.inquiryId,
          purpose: `Online Admission Consultation (${currentLead.admissionClass})`,
        }),
      });
      const data = await res.json();
      await minWait;

      const apt = data.appointment || {
        id: `GPUC-2026-APT-${Date.now().toString().slice(-4)}`,
        mode: 'online_meeting',
        date: targetDate,
        timeSlot: '09:00 AM',
        meetingLinkOrVenue: 'Online Consultation (Admissions Team)',
      };

      setBookingFlowState('completed');

      const replyContent = `Your online consultation is confirmed for tomorrow at 9:00 AM (Ref: ${apt.id}).\n\nOur Admissions team will contact you 1 minute before the allocated time and you will receive a WhatsApp notification confirming your ticket initiation and request.`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: enforceMaxThreeLines(replyContent),
          step: 'completed',
          ticketData: {
            id: apt.id,
            mode: 'online_meeting',
            date: apt.date,
            timeSlot: apt.timeSlot,
            venue: apt.meetingLinkOrVenue,
            studentName: currentLead.studentName,
            mobile: currentLead.mobile,
            instructions: 'Our Admissions team will contact you 1 minute before the allocated time and you will receive a WhatsApp notification confirming your ticket initiation and request.',
          },
        },
      ]);
    } catch (err) {
      console.error('Confirm 9am booking error:', err);
      handleCannotAgreeDeskFallback();
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Show Custom Date/Time Picker
  const handleShowCustomSlotPicker = async () => {
    const userMsg: Message = { role: 'user', content: 'Choose another date and time' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      const slots = data.availableSlots || [];
      setAvailableSlotsList(slots);
      setBookingFlowState('choosing_custom');

      setTimeout(() => {
        setIsTyping(false);
        const replyContent = `Please select an available timetable slot below or enter your preferred date and time:`;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: enforceMaxThreeLines(replyContent),
            step: 'choose_custom_slot',
            availableSlotsList: slots,
          },
        ]);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  };

  // Check custom slot with timetable and book or offer next
  const handleCheckAndBookCustomSlot = async (selDate: string, selTime: string) => {
    const currentLead = userLead || {
      inquiryId: 'GPUC-2026-INQ-1001',
      studentName: leadStudentName || 'Prospective Student',
      parentName: leadParentName,
      mobile: leadMobile || '9845012345',
      admissionClass: '12th Class (2nd PU)',
      inquiryType: 'Online Meeting',
    };

    const userMsg: Message = { role: 'user', content: `${selDate} at ${selTime}` };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setLoading(true);

    try {
      const minWait = new Promise((res) => setTimeout(res, 1500));
      // 1. Check availability with timetable
      const checkRes = await fetch(`/api/appointments?date=${encodeURIComponent(selDate)}&time=${encodeURIComponent(selTime)}`);
      const checkData = await checkRes.json();

      if (checkData.available) {
        // Book the slot!
        const bookRes = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentLead.studentName + (currentLead.parentName ? ` (Parent: ${currentLead.parentName})` : ''),
            mobile: currentLead.mobile,
            mode: 'online_meeting',
            date: selDate,
            timeSlot: selTime,
            inquiryId: currentLead.inquiryId,
            purpose: `Online Admission Consultation (${currentLead.admissionClass})`,
          }),
        });
        const bookData = await bookRes.json();
        await minWait;

        const apt = bookData.appointment;
        setBookingFlowState('completed');

        const replyContent = `Your online consultation is confirmed for ${apt.date} at ${apt.timeSlot} (Ref: ${apt.id}).\n\nOur Admissions team will contact you 1 minute before the allocated time and you will receive a WhatsApp notification confirming your ticket initiation and request.`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: enforceMaxThreeLines(replyContent),
            step: 'completed',
            ticketData: {
              id: apt.id,
              mode: 'online_meeting',
              date: apt.date,
              timeSlot: apt.timeSlot,
              venue: apt.meetingLinkOrVenue,
              studentName: currentLead.studentName,
              mobile: currentLead.mobile,
              instructions: 'Our Admissions team will contact you 1 minute before the allocated time and you will receive a WhatsApp notification confirming your ticket initiation and request.',
            },
          },
        ]);
      } else {
        // Unavailable! Offer the next slot available
        await minWait;
        const next = checkData.nextAvailableSlot;
        if (next) {
          setOfferedNextSlot({ date: next.date, time: next.time });
          setBookingFlowState('offered_next_slot');

          const replyContent = `That slot is not available. The next available slot with Admissions is on ${next.date} at ${next.time}.\n\nWould that slot work for you?`;

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: enforceMaxThreeLines(replyContent),
              step: 'offer_next_slot',
              slotOffer: {
                date: next.date,
                time: next.time,
                formatted: `${next.date} at ${next.time}`,
              },
            },
          ]);
        } else {
          handleCannotAgreeDeskFallback();
        }
      }
    } catch (err) {
      console.error('Custom slot checking error:', err);
      handleCannotAgreeDeskFallback();
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Fallback to Desk Helpline when agreement cannot be reached
  const handleCannotAgreeDeskFallback = () => {
    setBookingFlowState('completed');
    setIsTyping(false);
    setLoading(false);

    const genericReply = `You can reach our Admissions help desk directly at +91 96069 41908 from 8:30 AM to 5:00 PM (Monday to Friday).\n\nOur counseling team will be happy to assist you in coordinating your visit or meeting.`;

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: enforceMaxThreeLines(genericReply),
        step: 'completed',
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading || isTyping) return;

    if (!isChatOpen) {
      setIsChatOpen(true);
    }

    // If user is currently in the middle of lead steps, allow answering via bottom chat bar:
    if (!userLead) {
      if (leadStep === 'ask_student_name') {
        setInput('');
        handleStudentNameSubmit(text);
        return;
      }
      if (leadStep === 'ask_contact') {
        setInput('');
        handleContactSubmit(undefined, text);
        return;
      }
      if (leadStep === 'ask_admission') {
        setInput('');
        handleAdmissionSubmit(text, 'Admissions 2026-27');
        return;
      }
    }

    // Handle user inputs during booking flow steps:
    if (bookingFlowState === 'offered_choice') {
      const lower = text.toLowerCase();
      if (lower.includes('offline') || lower.includes('campus') || lower.includes('visit') || lower.includes('in person')) {
        setInput('');
        handleBookOfflineVisit();
        return;
      }
      if (lower.includes('online') || lower.includes('meeting') || lower.includes('virtual') || lower.includes('call') || lower.includes('meet')) {
        setInput('');
        handleInitiateOnlineMeeting();
        return;
      }
      if (lower.includes('no') || lower.includes('skip') || lower.includes('later')) {
        setInput('');
        setBookingFlowState('completed');
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: text },
          { role: 'assistant', content: 'No problem! Feel free to ask any question about GPUC courses, admissions, or facilities.' },
        ]);
        return;
      }
    }

    if (bookingFlowState === 'offered_tomorrow_9am') {
      const lower = text.toLowerCase();
      if (lower.includes('yes') || lower.includes('sure') || lower.includes('ok') || lower.includes('fine') || lower.includes('good') || lower.includes('tomorrow') || lower.includes('9')) {
        setInput('');
        handleConfirmTomorrow9Am();
        return;
      }
      if (lower.includes('no') || lower.includes('other') || lower.includes('different') || lower.includes('another') || lower.includes('change')) {
        setInput('');
        handleShowCustomSlotPicker();
        return;
      }
      if (lower.includes('cannot') || lower.includes("can't") || lower.includes('cancel') || lower.includes('desk') || lower.includes('call')) {
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        handleCannotAgreeDeskFallback();
        return;
      }
    }

    if (bookingFlowState === 'choosing_custom') {
      setInput('');
      const targetDate = customSlotDate || tomorrowDateStr || getTomorrowDateString();
      handleCheckAndBookCustomSlot(targetDate, text);
      return;
    }

    if (bookingFlowState === 'offered_next_slot') {
      const lower = text.toLowerCase();
      if (lower.includes('yes') || lower.includes('sure') || lower.includes('ok') || lower.includes('works') || lower.includes('fine')) {
        setInput('');
        if (offeredNextSlot) {
          handleCheckAndBookCustomSlot(offeredNextSlot.date, offeredNextSlot.time);
        }
        return;
      }
      if (lower.includes('no') || lower.includes('cannot') || lower.includes("can't") || lower.includes('none') || lower.includes('cancel')) {
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        handleCannotAgreeDeskFallback();
        return;
      }
    }

    // Standard question flow
    const userMsg: Message = { role: 'user', content: text };
    setInput('');

    // GREETINGS: "hi", "hello", "hey" etc. get a direct warm greeting, NOT a lead funnel or "information about hi"!
    if (isGreetingQuery(text)) {
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        const greetingContent = userLead
          ? `Hello ${userLead.studentName}! Welcome back to Gopalan Pre-University College. 👋\n\nHow can I help you today? Feel free to ask any question about courses, admissions, or campus visits.`
          : `Hello! Welcome to Gopalan Pre-University College. 👋\n\nHow can I help you today? Please choose an option below or type your question:`;

        const greetingReply: Message = {
          role: 'assistant',
          content: greetingContent,
        };
        setMessages((prev) => [...prev, greetingReply]);
      }, 1500);

      return;
    }

    // PRESET QUESTIONS OR RESEMBLING QUESTIONS:
    // "as soon as i select any preset qw or resemble those qw ask for name, details"
    if (!userLead && isPresetOrResemblingQuery(text)) {
      const topic = getTopicFromQuery(text);
      setPendingQuery(text);
      setPendingTopic(topic);
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Bouncing dots for 1.5 seconds, then display assistant prompt for Student Name
      setTimeout(() => {
        setIsTyping(false);
        setLeadStep('ask_student_name');

        const assistantPromptMsg: Message = {
          role: 'assistant',
          content: `I would be happy to share details about ${topic}! 🎓\n\nCould you please provide the Name of the Student?`,
          topic,
          step: 'ask_student_name',
          pendingQuery: text,
        };

        setMessages((prev) => [...prev, assistantPromptMsg]);
      }, 1500);

      return;
    }

    // GENERAL & BASIC QUESTIONS for already registered user
    if (userLead) {
      // Update server inquiry with new chat information
      fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userLead.inquiryId,
          chatInfo: text,
        }),
      }).catch((err) =>
        console.error('Failed to update inquiry chat notes:', err)
      );
    }

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);
    setLoading(true);

    try {
      const minWaitPromise = new Promise((res) => setTimeout(res, 1500));
      const chatPromise = fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          userContext: userLead,
        }),
      }).then((r) => r.json());

      const [_, data] = await Promise.all([minWaitPromise, chatPromise]);

      const botContent = enforceMaxThreeLines(data.content || 'I have noted your request.');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: botContent,
          toolCalls: data.toolCalls,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sure, I will help you with your query about Gopalan PU College.\n\nYou may also contact our admissions desk directly at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM) or email admin@gopalanpucollege.com.`,
        },
      ]);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_GREETING]);
    setInput('');
    setUserLead(null);
    setLeadStep('idle');
    setPendingQuery('');
    setPendingTopic('');
    setLeadStudentName('');
    setLeadParentName('');
    setLeadMobile('');
    setStepStudentName('');
    setStepParentName('');
    setStepMobile('');
    setStepError('');
    setIsTyping(false);
    setLoading(false);
    setIsSubmittingLead(false);
    setBookingFlowState('idle');
    setTomorrowDateStr('');
    setOfferedNextSlot(null);
    setAvailableSlotsList([]);
    setCustomSlotDate('');
    setCustomSlotTime('10:00 AM');
  };

  const getInputPlaceholder = () => {
    if (!userLead) {
      if (leadStep === 'ask_student_name') return "Enter student's full name...";
      if (leadStep === 'ask_contact') return "Enter 10-digit mobile number...";
      if (leadStep === 'ask_admission') return "Type class or choose an option above...";
    }
    if (bookingFlowState === 'offered_choice') return "Type 'offline' for visit or 'online' for meeting...";
    if (bookingFlowState === 'offered_tomorrow_9am') return "Type 'yes' or 'choose another time'...";
    if (bookingFlowState === 'choosing_custom') return "Type preferred time (e.g. 11:30 AM)...";
    if (bookingFlowState === 'offered_next_slot') return "Type 'yes' to accept or 'no'...";
  };

  const handleFeedbackSubmit = async () => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSubmitted(false);
        setFeedbackComment('');
      }, 2000);
    } catch (err) {
      console.error('Feedback submit error:', err);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Background: Actual Gopalan PU College Website */}
      <GpucWebsite onOpenChatWithQuery={(query) => handleSend(query)} />

      {/* FLOATING CORNER CHATBOT WIDGET */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {/* Floating Chatbot Circular Button (when chat is closed) */}
        {!isChatOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {/* Optional lightweight tooltip shown ONLY when actively hovering */}
            {isHovered && (
              <div
                style={{
                  marginBottom: '10px',
                  background: 'rgba(11, 23, 39, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #F59E0B',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'fadeIn 0.2s ease-out',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                  GPUC AI Assistant &bull; Click to chat
                </span>
              </div>
            )}

            {/* Gopalan Crest Icon Floating Circle */}
            <button
              onClick={() => setIsChatOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label="Open Gopalan PU College Assistant"
              style={{
                width: '66px',
                height: '66px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '3px solid #F59E0B',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45), 0 0 0 3px rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                padding: 0,
              }}
            >
              <img
                src="/gopalan_crest.svg"
                alt="Gopalan PU College"
                style={{
                  width: '46px',
                  height: '46px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />

              {/* Pulsing online indicator */}
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  border: '2.5px solid #060D19',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                }}
              />
            </button>
          </div>
        )}

        {/* EXPANDED CHAT WIDGET WINDOW */}
        {isChatOpen && (
          <div
            id="gpuc-chat-window"
            className="chat-widget-window"
            onWheel={(e) => {
              // Contain wheel events within the chat window so background page never scrolls
              e.stopPropagation();
            }}
            style={{
              width: '420px',
              maxWidth: 'calc(100vw - 32px)',
              height: '640px',
              maxHeight: 'calc(100vh - 48px)',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '20px',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.08)',
              animation: 'fadeIn 0.25s ease-out',
              overflow: 'hidden',
              overscrollBehavior: 'contain',
              position: 'relative',
            }}
          >
            {/* Widget Header */}
            <div
              style={{
                flexShrink: 0,
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #1E3A8A, #0F172A)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '2px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/gopalan_crest.svg"
                    alt="GPUC Logo"
                    style={{
                      width: '28px',
                      height: '28px',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>
                    GPUC AI Admissions Assistant
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></span>
                    Grounded on Gopalan PU Records
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={handleReset}
                  title="Reset Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  title="Minimize Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  title="Close Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Active Registered Enquirer Strip */}
            {userLead && (
              <div
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  background: '#F0FDF4',
                  borderBottom: '1px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.74rem',
                  color: '#166534',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#16A34A" />
                  <span>
                    Enquirer: <strong>{userLead.studentName}</strong> ({userLead.admissionClass})
                  </span>
                </div>
                <span style={{ color: '#15803D', fontWeight: 700 }}>Ref: {userLead.inquiryId}</span>
              </div>
            )}

            {/* Messages Feed */}
            <div
              id="gpuc-chat-messages"
              className="chat-messages-container"
              style={{
                flex: '1 1 0%',
                minHeight: 0,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: '#F8FAFC',
              }}
            >
              {messages.map((msg, index) => {
                const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf('assistant');
                const showPresetsUnderMsg =
                  !userLead &&
                  leadStep === 'idle' &&
                  msg.role === 'assistant' &&
                  index === lastAssistantIdx;

                return (
                  <div
                    key={index}
                    className="animate-fade-in"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: msg.step ? '100%' : '90%',
                      width: msg.step ? '100%' : 'auto',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: msg.role === 'user' ? '#1E3A8A' : '#64748B',
                        marginBottom: '3px',
                        marginLeft: msg.role === 'user' ? 'auto' : '4px',
                        marginRight: msg.role === 'user' ? '4px' : 'auto',
                        fontWeight: 700,
                      }}
                    >
                      {msg.role === 'user' ? 'You' : 'GPUC Assistant'}
                    </div>

                    <div
                      style={{
                        background: msg.role === 'user' ? 'linear-gradient(135deg, #1E3A8A, #2563EB)' : '#FFFFFF',
                        borderRadius:
                          msg.role === 'user'
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                        padding: '13px 16px',
                        color: msg.role === 'user' ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.86rem',
                        lineHeight: 1.6,
                        border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0',
                        boxShadow: msg.role === 'user' ? '0 2px 8px rgba(30, 58, 138, 0.25)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                        width: msg.step ? '100%' : 'auto',
                        boxSizing: 'border-box',
                      }}
                      className={msg.role === 'user' ? 'prose-chat prose-chat-user' : 'prose-chat prose-chat-bot'}
                    >
                      {formatPhoneNumbers(stripStarsAndAsterisks(msg.content))}

                      {/* Clickable Preset Chips inside bubble */}
                      {showPresetsUnderMsg && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px solid #E2E8F0',
                          }}
                        >
                          {FAQ_PRESETS.map((preset, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => handleSend(preset.query)}
                              disabled={loading || isTyping}
                              className="chip-btn"
                              style={{
                                background: '#FEF3C7',
                                borderColor: '#F59E0B',
                                color: '#92400E',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                padding: '6px 11px',
                              }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step 1: Student Name Card */}
                      {msg.step === 'ask_student_name' && leadStep === 'ask_student_name' && !userLead && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={13} color="#D97706" /> Step 1: Student Details
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>1 of 3</span>
                          </div>

                          {stepError && (
                            <div style={{ marginBottom: '8px', padding: '6px 10px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={13} />
                              <span>{stepError}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                              <input
                                type="text"
                                value={stepStudentName}
                                onChange={(e) => {
                                  setStepStudentName(e.target.value);
                                  if (stepError) setStepError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleStudentNameSubmit()}
                                placeholder="Enter student's full name"
                                autoFocus
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '8px 12px 8px 34px',
                                  background: '#F8FAFC',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '8px',
                                  color: '#0F172A',
                                  fontSize: '0.84rem',
                                  outline: 'none',
                                }}
                              />
                              <User size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStudentNameSubmit()}
                              className="btn-primary"
                              style={{
                                flexShrink: 0,
                                padding: '8px 14px',
                                fontSize: '0.82rem',
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Next <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Parent Name & Mobile Card */}
                      {msg.step === 'ask_contact' && leadStep === 'ask_contact' && !userLead && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={13} color="#D97706" /> Step 2: Contact Information
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>2 of 3</span>
                          </div>

                          {stepError && (
                            <div style={{ marginBottom: '8px', padding: '6px 10px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={13} />
                              <span>{stepError}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                            <div>
                              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                                Parent / Guardian Name <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                              </div>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  value={stepParentName}
                                  onChange={(e) => setStepParentName(e.target.value)}
                                  placeholder="Enter parent or guardian full name"
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '8px 12px 8px 34px',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    color: '#0F172A',
                                    fontSize: '0.84rem',
                                    outline: 'none',
                                  }}
                                />
                                <Users size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                                Mobile / WhatsApp Phone Number <span style={{ color: '#D97706', fontSize: '0.7rem', fontWeight: 600 }}>(Required)</span>
                              </div>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="tel"
                                  value={stepMobile}
                                  maxLength={15}
                                  onChange={(e) => {
                                    setStepMobile(e.target.value);
                                    if (stepError) setStepError('');
                                  }}
                                  onKeyDown={(e) => e.key === 'Enter' && handleContactSubmit()}
                                  placeholder="10-digit mobile number (e.g. 98450 12345)"
                                  autoFocus
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '8px 12px 8px 34px',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    color: '#0F172A',
                                    fontSize: '0.84rem',
                                    outline: 'none',
                                  }}
                                />
                                <Phone size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleContactSubmit()}
                              className="btn-primary"
                              style={{
                                marginTop: '2px',
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '9px 14px',
                                fontSize: '0.82rem',
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                justifyContent: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              Next: Select Class / Inquiry <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Class / Inquiry Selection Card */}
                      {msg.step === 'ask_admission' && leadStep === 'ask_admission' && !userLead && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={13} color="#D97706" /> Step 3: Choose Admission Option
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>3 of 3</span>
                          </div>

                          <div style={{ fontSize: '0.76rem', color: '#475569', marginBottom: '10px' }}>
                            Tap an option below to register and instantly receive full details:
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '8px',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                          >
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('12th Class (2nd PU)', 'Admissions 2026-27')}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: '#FEF3C7',
                                border: '1px solid #F59E0B',
                                color: '#92400E',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                borderRadius: '8px',
                                cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                width: '100%',
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              🎓 12th Class (2nd PU)
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('11th Class (1st PU)', 'Admissions 2026-27')}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: '#EFF6FF',
                                border: '1px solid #3B82F6',
                                color: '#1E40AF',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                borderRadius: '8px',
                                cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                width: '100%',
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              🎒 11th Class (1st PU)
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('11th/12th PU', 'Campus Visit')}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: '#F0FDF4',
                                border: '1px solid #22C55E',
                                color: '#166534',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                borderRadius: '8px',
                                cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                width: '100%',
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              🏫 Campus Visit
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('General PU', 'Admissions 2026-27')}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: '#F1F5F9',
                                border: '1px solid #94A3B8',
                                color: '#334155',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                borderRadius: '8px',
                                cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                width: '100%',
                                boxSizing: 'border-box',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              📋 General Inquiry
                            </button>
                          </div>

                          {isSubmittingLead && (
                            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#D97706', textAlign: 'center', fontWeight: 600 }}>
                              Registering inquiry with Gopalan admissions server...
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step: Offer Offline Campus Visit vs Online Meeting */}
                      {msg.step === 'offer_visit_or_online' && bookingFlowState === 'offered_choice' && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Sparkles size={13} color="#D97706" /> Consultation & Visit Options
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleBookOfflineVisit()}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                                border: '1.5px solid #F59E0B',
                                borderRadius: '10px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem' }}>
                                  🏫
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400E' }}>
                                    Book a Campus Visit (Offline)
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#78350F' }}>
                                    Tour Whitefield campus &bull; Instant visit ticket
                                  </div>
                                </div>
                              </div>
                              <ArrowRight size={15} color="#D97706" />
                            </button>

                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleInitiateOnlineMeeting()}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                                border: '1.5px solid #3B82F6',
                                borderRadius: '10px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem' }}>
                                  💻
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E40AF' }}>
                                    Request an Online Meeting
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#1E3A8A' }}>
                                    Admissions video consultation &bull; Check timetable
                                  </div>
                                </div>
                              </div>
                              <ArrowRight size={15} color="#2563EB" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setBookingFlowState('completed');
                                setMessages((prev) => [
                                  ...prev,
                                  { role: 'assistant', content: 'No problem! Feel free to ask any other questions about courses, combinations, or facilities.' },
                                ]);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748B',
                                fontSize: '0.74rem',
                                padding: '4px',
                                cursor: 'pointer',
                                textAlign: 'center',
                              }}
                            >
                              Skip for now
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step: Ask if tomorrow at 9:00 AM works */}
                      {msg.step === 'ask_tomorrow_9am' && bookingFlowState === 'offered_tomorrow_9am' && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #3B82F6',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={13} color="#2563EB" /> Admissions Desk Availability Check
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>
                              Slot Open
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: '#1E293B', marginBottom: '10px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            📅 <strong>Tomorrow ({tomorrowDateStr || 'Upcoming'}) at 09:00 AM</strong> with Admissions Counselor
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleConfirmTomorrow9Am()}
                              style={{
                                padding: '9px 12px',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Check size={14} /> Yes, tomorrow at 9:00 AM works
                            </button>

                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleShowCustomSlotPicker()}
                              style={{
                                padding: '8px 12px',
                                background: '#F1F5F9',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Calendar size={13} /> Choose another date & time
                            </button>

                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleCannotAgreeDeskFallback()}
                              style={{
                                padding: '7px 12px',
                                background: '#FFF1F2',
                                color: '#BE123C',
                                border: '1px solid #FECDD3',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Phone size={13} /> Cannot make this time &bull; Contact Desk
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step: Choose Custom Slot from Timetable */}
                      {msg.step === 'choose_custom_slot' && bookingFlowState === 'choosing_custom' && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #3B82F6',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1E40AF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} color="#2563EB" /> Select Timetable Slot
                          </div>

                          {availableSlotsList.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '10px' }}>
                              {availableSlotsList.slice(0, 4).map((slot, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  disabled={loading || isTyping}
                                  onClick={() => handleCheckAndBookCustomSlot(slot.date, slot.time)}
                                  style={{
                                    padding: '7px 8px',
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#1E40AF',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                  }}
                                >
                                  {slot.date} &bull; {slot.time}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Custom date and time selectors */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            <input
                              type="date"
                              value={customSlotDate || tomorrowDateStr}
                              onChange={(e) => setCustomSlotDate(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.78rem',
                                color: '#0F172A',
                                background: '#F8FAFC',
                                outline: 'none',
                              }}
                            />
                            <select
                              value={customSlotTime}
                              onChange={(e) => setCustomSlotTime(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.78rem',
                                color: '#0F172A',
                                background: '#F8FAFC',
                                outline: 'none',
                              }}
                            >
                              <option value="09:00 AM">09:00 AM</option>
                              <option value="10:00 AM">10:00 AM</option>
                              <option value="11:30 AM">11:30 AM</option>
                              <option value="02:00 PM">02:00 PM</option>
                              <option value="03:30 PM">03:30 PM</option>
                            </select>
                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleCheckAndBookCustomSlot(customSlotDate || tomorrowDateStr, customSlotTime)}
                              style={{
                                padding: '6px 12px',
                                background: '#3B82F6',
                                color: '#fff',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Check
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCannotAgreeDeskFallback()}
                            style={{
                              width: '100%',
                              padding: '6px',
                              background: '#FFF1F2',
                              color: '#BE123C',
                              border: '1px solid #FECDD3',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                          >
                            None of these work &bull; Reach Help Desk
                          </button>
                        </div>
                      )}

                      {/* Step: Offer Next Available Slot if requested slot was booked */}
                      {msg.step === 'offer_next_slot' && bookingFlowState === 'offered_next_slot' && offeredNextSlot && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFFFFF',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={13} color="#D97706" /> Next Available Slot Offered
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                              Open Slot
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#1E293B', marginBottom: '10px', background: '#FFFBEB', padding: '8px 10px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                            📅 <strong>{offeredNextSlot.date} at {offeredNextSlot.time}</strong> with Admissions Desk
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleCheckAndBookCustomSlot(offeredNextSlot.date, offeredNextSlot.time)}
                              style={{
                                padding: '9px 12px',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Check size={14} /> Yes, book {offeredNextSlot.date} at {offeredNextSlot.time}
                            </button>

                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleCannotAgreeDeskFallback()}
                              style={{
                                padding: '8px 12px',
                                background: '#FFF1F2',
                                color: '#BE123C',
                                border: '1px solid #FECDD3',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Phone size={13} /> Cannot make this time &bull; Contact Desk
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Confirmed Ticket Card (Campus Visit or Online Meeting) */}
                      {msg.ticketData && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: msg.ticketData.mode === 'campus_visit' ? '#FFFDF5' : '#F8FAFC',
                            border: msg.ticketData.mode === 'campus_visit' ? '1.5px solid #F59E0B' : '1.5px solid #3B82F6',
                            borderRadius: '12px',
                            padding: '14px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px', color: msg.ticketData.mode === 'campus_visit' ? '#92400E' : '#1E40AF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {msg.ticketData.mode === 'campus_visit' ? '🏫 CAMPUS VISIT TICKET' : '💻 ONLINE MEETING CONFIRMED'}
                            </span>
                            <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>
                              CONFIRMED
                            </span>
                          </div>

                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>Ticket / Appointment Reference</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px' }}>
                              {msg.ticketData.id}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Student Name</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{msg.ticketData.studentName}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Registered Mobile</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{msg.ticketData.mobile}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Date / Schedule</div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>{msg.ticketData.date}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.68rem', color: '#64748B' }}>Time Slot</div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>{msg.ticketData.timeSlot}</div>
                            </div>
                          </div>

                          {/* Campus Visiting Location only for offline visits */}
                          {msg.ticketData.mode === 'campus_visit' && (
                            <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '8px' }}>
                              <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>Campus Visiting Location:</div>
                              <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 600, marginTop: '2px' }}>
                                {msg.ticketData.venue}
                              </div>
                            </div>
                          )}

                          {/* Admissions Notification Banner (replaces Google Meet venue info) */}
                          {msg.ticketData.instructions && (
                            <div
                              style={{
                                background: msg.ticketData.mode === 'online_meeting' ? '#F0FDF4' : '#F8FAFC',
                                border: msg.ticketData.mode === 'online_meeting' ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '9px 12px',
                                fontSize: '0.76rem',
                                color: msg.ticketData.mode === 'online_meeting' ? '#14532D' : '#475569',
                                lineHeight: 1.45,
                                fontWeight: msg.ticketData.mode === 'online_meeting' ? 600 : 500,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                              }}
                            >
                              <span style={{ fontSize: '1rem', lineHeight: 1 }}>
                                {msg.ticketData.mode === 'online_meeting' ? '📱' : 'ℹ️'}
                              </span>
                              <span>{msg.ticketData.instructions}</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Tool Execution Cards */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {msg.toolCalls.map((tc, tcIdx) => {
                          if (tc.tool === 'create_appointment' && tc.result?.success) {
                            return (
                              <div
                                key={tcIdx}
                                style={{
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  borderRadius: '8px',
                                  padding: '10px 12px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <div style={{ color: '#1E40AF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Calendar size={14} /> Appointment Confirmed: {tc.result.appointment_id}
                                </div>
                                <div style={{ color: '#475569', marginTop: '4px' }}>
                                  {tc.result.date} at {tc.result.time_slot}
                                </div>
                              </div>
                            );
                          }
                          if (tc.tool === 'create_inquiry' && tc.result?.success) {
                            return (
                              <div
                                key={tcIdx}
                                style={{
                                  background: '#FEF3C7',
                                  border: '1px solid #FCD34D',
                                  borderRadius: '8px',
                                  padding: '10px 12px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <div style={{ color: '#92400E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <CheckCircle size={14} /> Ref: {tc.result.inquiry_id} (Assigned to {tc.result.assigned_team})
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {(isTyping || loading) && (
                <div
                  className="animate-fade-in"
                  style={{
                    alignSelf: 'flex-start',
                    background: '#FFFFFF',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div className="bouncing-dots">
                    <div className="bouncing-dot" />
                    <div className="bouncing-dot" />
                    <div className="bouncing-dot" />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                    GPUC Assistant is typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Horizontal Presets Bar */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                overscrollBehavior: 'contain',
                padding: '8px 12px',
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                scrollbarWidth: 'none',
              }}
            >
              {FAQ_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(preset.query)}
                  disabled={loading || isTyping}
                  className="chip-btn"
                  style={{
                    flexShrink: 0,
                    fontSize: '0.74rem',
                    padding: '5px 11px',
                    whiteSpace: 'nowrap',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    color: '#1E3A8A',
                    fontWeight: 600,
                    borderRadius: '16px',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                flexShrink: 0,
                padding: '10px 12px',
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getInputPlaceholder()}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: '#0F172A',
                  outline: 'none',
                  fontSize: '0.86rem',
                  padding: '9px 12px',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                }}
                disabled={loading || isTyping}
              />

              <button
                type="submit"
                className="btn-primary"
                disabled={loading || isTyping || !input.trim()}
                style={{
                  flexShrink: 0,
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: loading || isTyping || !input.trim() ? 0.5 : 1,
                  cursor: loading || isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#FFFFFF',
                  border: 'none',
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* User Feedback Modal */}
      {showFeedbackModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '28px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', color: '#0F172A', marginBottom: '8px' }}>
              Rate Your Experience
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '18px' }}>
              Was this assistant helpful? Your feedback directly helps Gopalan PU College improve guidance for parents and students.
            </p>

            {feedbackSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#16A34A', fontWeight: 700 }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px' }} />
                Thank you! Your feedback has been recorded.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                  {[1, 2, 3, 4, 5].map((ratingVal) => (
                    <button
                      key={ratingVal}
                      type="button"
                      onClick={() => setFeedbackRating(ratingVal)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: feedbackRating === ratingVal ? '2px solid #F59E0B' : '1px solid #CBD5E1',
                        background: feedbackRating === ratingVal ? '#FEF3C7' : '#F8FAFC',
                        color: feedbackRating === ratingVal ? '#92400E' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      {ratingVal}
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Optional comments or suggestions..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#0F172A',
                    outline: 'none',
                    fontSize: '0.88rem',
                    marginBottom: '18px',
                    resize: 'none',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFeedbackSubmit}
                    className="btn-primary"
                    style={{ padding: '8px 20px', color: '#FFFFFF' }}
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
