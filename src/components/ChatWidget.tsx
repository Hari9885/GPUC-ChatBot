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
  Minimize2,
  ChevronDown,
  User,
  Users,
  Phone,
  PhoneCall,
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

const ADMISSION_TIME_OPTIONS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  topic?: string;
  step?:
    | 'ask_student_name'
    | 'ask_contact'
    | 'ask_admission'
    | 'offer_visit_or_online'
    | 'ask_custom_slot'
    | 'show_available_slots'
    | 'completed';
  leadInquiryId?: string;
  pendingQuery?: string;
  isProactiveCallbackCard?: boolean;
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
  location?: string;
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

  // 1. Direct matches with preset FAQs (the 6 buttons or their explicit titles)
  const matchesPreset = FAQ_PRESETS.some(
    (p) =>
      p.query.toLowerCase() === q ||
      q === p.title.toLowerCase() ||
      q === p.label.toLowerCase() ||
      q === `tell me about ${p.title.toLowerCase()}` ||
      q === `what about ${p.title.toLowerCase()}`
  );
  if (matchesPreset) return true;

  // 2. Clear intent to register / apply / start admission / book visit
  const isDirectApplyIntent =
    /^(i want to (apply|register|join|admit|take admission|book|enroll))|^(how do i (apply|register|enroll|book a visit))|^(admissions? 2026|apply for admission)$/i.test(q);

  return isDirectApplyIntent;
}

function getTopicOverview(text: string): { overview: string; followUp: string } {
  const q = text.toLowerCase();

  if (q.includes('science') || q.includes('pcmb') || q.includes('pcmc')) {
    return {
      overview: `Science Streams Available:
• PCMB: Physics, Chemistry, Mathematics, Biology
• PCMC: Physics, Chemistry, Mathematics, Computer Science
• Integrated Coaching: NEET, JEE & KCET
• Languages: English + Kannada / Hindi`,
      followUp: `To apply or receive syllabus details, enter student name:`,
    };
  }

  if (q.includes('commerce') || q.includes('ceba')) {
    return {
      overview: `Commerce Stream Available:
• CEBA: Computer Science, Economics, Business Studies, Accountancy
• Focus: CA Foundation, CS & B.Com career pathways
• Languages: English + Kannada / Hindi`,
      followUp: `To apply or receive course details, enter student name:`,
    };
  }

  if (q.includes('fee') || q.includes('cost') || q.includes('scholarship') || q.includes('tuition')) {
    return {
      overview: `Official Fee & Help Desk:
• Helpline: +91 81053 88193 / +91 81230 40418 / +91 96320 70209
• Email: gpuc.north@gopalanpucollege.com
• Timings: Mon–Sat, 8:30 AM to 5:00 PM`,
      followUp: `Please let us know which stream or facility you would like to explore:`,
    };
  }

  if (q.includes('document') || q.includes('certif') || q.includes('marks card') || q.includes('tc')) {
    return {
      overview: `Required Admission Documents:
• 10th / SSLC Marks Card (original + 3 copies)
• Transfer Certificate (TC) & Conduct Certificate
• Migration Certificate (for CBSE / ICSE boards)
• Student & Parent Aadhaar + 5 Photos`,
      followUp: `To start document verification, enter student name (or skip):`,
    };
  }

  if (q.includes('visit') || q.includes('tour') || q.includes('consult') || q.includes('appointment')) {
    return {
      overview: `Campus Visit & Counseling:
• Location: North Campus, Yelahanka (No. 79, Mavallipura)
• Timings: Monday – Saturday, 8:30 AM to 5:00 PM
• Campus: Science/CS Labs, Library, Sports grounds & Hostel`,
      followUp: `To book a visit or counseling slot, enter student name (or skip):`,
    };
  }

  if (q.includes('admission') || q.includes('apply') || q.includes('2026') || q.includes('process') || q.includes('eligib')) {
    return {
      overview: `Admissions 2026–27 (1st & 2nd PU):
• Streams: Science (PCMB, PCMC) & Commerce (CEBA)
• Eligibility: 10th / SSLC Pass (State Board, CBSE, ICSE)
• Mode: Direct Merit & Counseling`,
      followUp: `To register your admission inquiry, enter student name (or skip):`,
    };
  }

  return {
    overview: `Available Courses (North Campus):
• Science: PCMB & PCMC (with NEET/JEE/KCET)
• Commerce: CEBA (Computer Science, Economics, Business, Accountancy)
• Timings: Mon–Sat, 8:30 AM–5:00 PM`,
    followUp: `To register an inquiry, enter student name (or skip):`,
  };
}

function getTopicFromQuery(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('fee') || q.includes('cost') || q.includes('scholarship') || q.includes('tuition') || q.includes('installment') || q.includes('accountant') || q.includes('payment') || q.includes('concession')) {
    return 'Fee Structure & Accounts Desk';
  }
  if (q.includes('science') || q.includes('pcmb') || q.includes('pcmc')) {
    return 'Science Stream Combinations (PCMB / PCMC)';
  }
  if (q.includes('commerce') || q.includes('ceba') || q.includes('seba') || q.includes('meba')) {
    return 'Commerce Stream Combinations (CEBA / SEBA / MEBA)';
  }
  if (q.includes('visit') || q.includes('tour') || q.includes('consult') || q.includes('appointment')) {
    return 'Campus Visit & Consultation';
  }
  if (q.includes('hostel') || q.includes('bus') || q.includes('transport') || q.includes('facility') || q.includes('mess')) {
    return 'Campus Facilities, Hostel & Transport';
  }
  if (q.includes('neet') || q.includes('jee') || q.includes('kcet') || q.includes('coaching')) {
    return 'Integrated Coaching (NEET / JEE / KCET)';
  }
  if (q.includes('document') || q.includes('certif') || q.includes('marks card') || q.includes('tc')) {
    return 'Required Documents';
  }
  if (q.includes('contact') || q.includes('phone') || q.includes('address') || q.includes('spoc')) {
    return 'College Contact & Admissions Desk';
  }
  if (q.includes('admission') || q.includes('apply') || q.includes('2026') || q.includes('process') || q.includes('eligib')) {
    return 'Admissions for Academic Year 2026–27';
  }
  return 'Admissions & College Information';
}

const FAQ_PRESETS = [
  {
    icon: '🎓',
    title: 'Admissions',
    label: '🎓 Admissions 2026–27',
    query: 'What is the admission process for academic year 2026-2027 at North Campus?',
  },
  {
    icon: '🔬',
    title: 'Science',
    label: '🔬 Science (PCMB / PCMC)',
    query: 'What Science combinations are offered at Gopalan PU College North Campus?',
  },
  {
    icon: '📊',
    title: 'Commerce',
    label: '📊 Commerce (CEBA)',
    query: 'What Commerce combinations are offered at Gopalan PU College North Campus?',
  },
  {
    icon: '📅',
    title: 'Campus Visit',
    label: '📅 Book a Campus Visit',
    query: 'How can I book a campus visit to the North Campus in Yelahanka?',
  },
  {
    icon: '📄',
    title: 'Documents',
    label: '📄 Required Documents',
    query: 'Which documents are required for admission at North Campus?',
  },
];

const INITIAL_GREETING: Message = {
  role: 'assistant',
  content: `Hello! Welcome to Gopalan Pre-University College, North Campus (Yelahanka). 👋

How can I help you today? Please choose an option below or type your question:`,
};

export default function ChatWidget({ initialEmbedded = false }: { initialEmbedded?: boolean }) {
  const [isChatOpen, setIsChatOpen] = useState(initialEmbedded);
  const [isHovered, setIsHovered] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // User Lead Capture & Step-by-Step Flow ("One question after another")
  const [userLead, setUserLead] = useState<UserLead | null>(null);
  const [hasSkippedLead, setHasSkippedLead] = useState(false);
  const [leadStep, setLeadStep] = useState<
    'idle' | 'ask_student_name' | 'ask_contact' | 'ask_admission' | 'completed'
  >('idle');
  const [pendingQuery, setPendingQuery] = useState('');
  const [pendingTopic, setPendingTopic] = useState('');

  // Values stored across steps
  const [leadStudentName, setLeadStudentName] = useState('');
  const [leadParentName, setLeadParentName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');
  const [leadLocation, setLeadLocation] = useState('');

  // Values in current step inputs
  const [stepStudentName, setStepStudentName] = useState('');
  const [stepParentName, setStepParentName] = useState('');
  const [stepMobile, setStepMobile] = useState('');
  const [stepLocation, setStepLocation] = useState('');
  const [stepError, setStepError] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Input refs for smooth keyboard navigation & focusing parent name first
  const parentInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Appointment & Meeting Booking Flow State
  const [bookingFlowState, setBookingFlowState] = useState<
    'idle' | 'offered_choice' | 'asking_check_slot' | 'showing_available_slots' | 'completed'
  >('idle');
  const [customSlotDate, setCustomSlotDate] = useState('');
  const [customSlotTime, setCustomSlotTime] = useState('10:00 AM');
  const [availableSlotsList, setAvailableSlotsList] = useState<Array<{ date: string; time: string; department: string }>>([]);

  // Session queries tracking for lead analytics (only saved if user provides phone number)
  const sessionQueriesRef = useRef<Array<{ query: string; timestamp: string }>>([]);
  const generalQueryCountRef = useRef<number>(0);
  const hasShownProactiveCardRef = useRef<boolean>(false);
  const activeInquiryIdRef = useRef<string | null>(null);

  // Proactive callback action card state
  const [proactiveCardMode, setProactiveCardMode] = useState<
    'idle' | 'immediate_callback' | 'schedule_call' | 'submitted' | 'dismissed'
  >('idle');
  const [proactiveName, setProactiveName] = useState<string>('');
  const [proactiveMobile, setProactiveMobile] = useState<string>('');
  const [proactiveSelectedSlot, setProactiveSelectedSlot] = useState<string>('10:00 AM (Morning)');
  const [proactiveError, setProactiveError] = useState<string>('');
  const [proactiveSubmitting, setProactiveSubmitting] = useState<boolean>(false);

  // Prominently highlight and bold help desk phone numbers with click-to-call links
  const renderHighlightedContent = (rawText: string, isUser: boolean = false) => {
    if (!rawText) return null;
    const cleaned = stripStarsAndAsterisks(rawText);

    // Regex matching Indian phone numbers: +91 81053 88193, 81053 88193, +91 81230 40418, +91 96320 70209, etc.
    const phoneRegex = /((?:\+91[\s\u00A0]?)?(?:81053[\s\u00A0]?88193|81230[\s\u00A0]?40418|96320[\s\u00A0]?70209|96069[\s\u00A0]?41908|[6-9]\d{4}[\s\u00A0]?\d{5}|[6-9]\d{9}))/g;

    const parts = cleaned.split(phoneRegex);

    return (
      <>
        {parts.map((part, idx) => {
          if (!part) return null;
          const isPhone = /^(?:\+91[\s\u00A0]?)?(?:81053[\s\u00A0]?88193|81230[\s\u00A0]?40418|96320[\s\u00A0]?70209|96069[\s\u00A0]?41908|[6-9]\d{4}[\s\u00A0]?\d{5}|[6-9]\d{9})$/.test(part.trim());
          if (isPhone) {
            const rawDigits = part.replace(/\D/g, '');
            const telDigits = rawDigits.startsWith('91') && rawDigits.length === 12 ? rawDigits : `91${rawDigits.slice(-10)}`;
            return (
              <a
                key={idx}
                href={`tel:+${telDigits}`}
                style={{
                  fontWeight: 800,
                  color: isUser ? '#FFFFFF' : '#0A4074',
                  backgroundColor: isUser ? 'rgba(255, 255, 255, 0.22)' : '#FEF3C7',
                  border: isUser ? '1px solid rgba(255, 255, 255, 0.35)' : '1.5px solid #F59E0B',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  margin: '1px 3px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  boxShadow: isUser ? 'none' : '0 1px 3px rgba(245, 158, 11, 0.2)',
                  verticalAlign: 'baseline',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
                title="Click to dial Admissions & Enquiry Help Desk"
              >
                <span style={{ fontSize: '0.8rem' }}>📞</span>
                <strong style={{ fontWeight: 800 }}>{formatPhoneNumbers(part)}</strong>
              </a>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isTyping, isChatOpen]);

  // When Step 2 (contact & location) appears, auto-focus Parent Name input (NOT mobile)
  useEffect(() => {
    if (leadStep === 'ask_contact') {
      const timer = setTimeout(() => {
        parentInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [leadStep]);

  const [isEmbedded, setIsEmbedded] = useState(initialEmbedded);

  // Check if running in embedded iframe mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        let inIframe = false;
        try {
          inIframe = window.self !== window.top;
        } catch (e) {
          inIframe = true;
        }
        const isEmb = initialEmbedded || params.get('embedded') === 'true' || inIframe;
        if (isEmb) {
          setIsEmbedded(true);
          setIsChatOpen(true);
        }
      } catch (err) {
        console.warn('Embed detection note:', err);
      }

      const handleMsg = (e: MessageEvent) => {
        if (e.data && typeof e.data === 'object') {
          if (e.data.type === 'GPUC_WIDGET_SET_OPEN') {
            setIsChatOpen(!!e.data.isOpen);
            setIsEmbedded(true);
          }
        }
      };
      window.addEventListener('message', handleMsg);

      // Auto 3 bounces on load, then auto-open the chat bot
      let startTimer: NodeJS.Timeout | null = null;
      let openTimer: NodeJS.Timeout | null = null;

      startTimer = setTimeout(() => {
        setIsBouncing(true);

        // 3 bounces * 650ms = 1950ms, then stop bouncing and open chat
        openTimer = setTimeout(() => {
          setIsBouncing(false);
          setIsChatOpen(true);
        }, 1950);
      }, 600);

      return () => {
        window.removeEventListener('message', handleMsg);
        if (startTimer) clearTimeout(startTimer);
        if (openTimer) clearTimeout(openTimer);
      };
    }
  }, [initialEmbedded]);

  // Handle Escape key to restore maximized view or close chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        if (isMaximized) {
          setIsMaximized(false);
          if (isEmbedded) {
            window.parent?.postMessage({ type: 'GPUC_CHAT_MAXIMIZE' }, '*');
          }
        } else {
          if (isEmbedded) {
            window.parent?.postMessage({ type: 'GPUC_CHAT_CLOSE' }, '*');
          } else {
            setIsChatOpen(false);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, isMaximized, isEmbedded]);

  // Close option: Dismiss the lead inquiry card cleanly without adding useless chat messages
  const handleCloseLead = () => {
    setHasSkippedLead(true);
    setLeadStep('idle');
    setStepError('');
    setStepStudentName('');
    setStepParentName('');
    setStepMobile('');
    setStepLocation('');
  };
  const handleSkipLead = handleCloseLead;

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
        content: `Thank you, ${name}! Could you please provide the Parent / Guardian Name, Mobile Number, and your Area / Location?`,
        step: 'ask_contact',
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1500);
  };

  // Step 2: Submit Parent Name, Mobile Number & Location (with 1.5s bouncing dots)
  const handleContactSubmit = (parentVal?: string, mobVal?: string, locVal?: string) => {
    const parent = (parentVal !== undefined ? parentVal : stepParentName).trim();
    let mob = (mobVal !== undefined ? mobVal : stepMobile).trim();
    const loc = (locVal !== undefined ? locVal : stepLocation).trim();

    const cleanDigits = mob.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setStepError('Please enter a valid 10-digit mobile number.');
      mobileInputRef.current?.focus();
      return;
    }
    setStepError('');
    setLeadParentName(parent);
    setLeadMobile(mob);
    setLeadLocation(loc);
    setStepParentName('');
    setStepMobile('');
    setStepLocation('');

    // Immediately save lead and all session queries to CRM and leads_chat_analysis.json
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: leadStudentName,
        parentName: parent,
        mobile: mob,
        location: loc,
        admissionClass: '12th Class (2nd PU) / 11th Class',
        inquiryType: 'Admissions 2026-27',
        queryTopic: pendingTopic || 'College Admissions',
        chatNotes: `Captured via Step 2 Contact Form. Pending query: ${pendingQuery}`,
        leadSource: 'onboarding_step_2',
        sessionQueries: sessionQueriesRef.current,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.inquiry?.id) {
          activeInquiryIdRef.current = data.inquiry.id;
          setUserLead({
            inquiryId: data.inquiry.id,
            studentName: leadStudentName,
            parentName: parent,
            mobile: mob,
            location: loc,
            admissionClass: '12th Class (2nd PU) / 11th Class',
            inquiryType: 'Admissions 2026-27',
          });
        }
      })
      .catch((err) => console.error('Early lead submit error:', err));

    const displayParts: string[] = [];
    if (parent) displayParts.push(`Parent: ${parent}`);
    displayParts.push(`Mobile: ${mob}`);
    if (loc) displayParts.push(`Location: ${loc}`);
    const displayUserText = displayParts.join(' • ');

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

      // 1. Submit or update lead in server CRM
      const leadPromise = activeInquiryIdRef.current
        ? fetch('/api/inquiries', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeInquiryIdRef.current,
              notes: `Admission choice: ${chosenClass} • ${chosenType}`,
            }),
          }).then((r) => r.json())
        : fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentName: leadStudentName,
              parentName: leadParentName,
              mobile: leadMobile,
              location: leadLocation,
              admissionClass: chosenClass,
              inquiryType: chosenType,
              queryTopic: pendingTopic || 'College Admissions',
              chatNotes: `Query: ${pendingQuery}`,
              leadSource: 'onboarding_step_3',
              sessionQueries: sessionQueriesRef.current,
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
            location: leadLocation,
            admissionClass: chosenClass,
            inquiryType: chosenType,
          },
        }),
      }).then((r) => r.json());

      const [_, inqData, chatData] = await Promise.all([minWaitPromise, leadPromise, chatPromise]);

      const newInquiryId =
        activeInquiryIdRef.current || inqData?.inquiry?.id || `GPUC-2026-INQ-${Date.now().toString().slice(-4)}`;

      const lead: UserLead = {
        inquiryId: newInquiryId,
        studentName: leadStudentName,
        parentName: leadParentName,
        mobile: leadMobile,
        location: leadLocation,
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
          content: `Thank you, ${leadStudentName}! I have noted your details.\n\nFor immediate assistance, please call our Admissions & Enquiry Help Desk at +91 81053 88193 / +91 81230 40418 / +91 96320 70209 or email gpuc.north@gopalanpucollege.com.`,
        },
      ]);
    } finally {
      setIsTyping(false);
      setIsSubmittingLead(false);
      setLoading(false);
    }
  };

  // Proactive 4th-Query Immediate Callback Submission
  const handleProactiveCallbackSubmit = async () => {
    const mob = proactiveMobile.trim();
    const cleanDigits = mob.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setProactiveError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setProactiveError('');
    setProactiveSubmitting(true);

    const name = proactiveName.trim() || leadStudentName || 'Prospective Student';

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: name,
          mobile: mob,
          admissionClass: '12th Class (2nd PU) / 11th Class',
          inquiryType: 'Immediate Callback Request',
          queryTopic: 'North Campus Admissions Guidance',
          chatNotes: 'Requested immediate callback after 4th general query',
          leadSource: 'proactive_immediate_callback',
          sessionQueries: sessionQueriesRef.current,
        }),
      });
      const data = await res.json();
      const inqId = data?.inquiry?.id || `GPUC-2026-INQ-${Date.now().toString().slice(-4)}`;

      activeInquiryIdRef.current = inqId;
      setUserLead({
        inquiryId: inqId,
        studentName: name,
        mobile: mob,
        admissionClass: '12th Class (2nd PU) / 11th Class',
        inquiryType: 'Immediate Callback Request',
      });
      setLeadStudentName(name);
      setLeadMobile(mob);
      setProactiveCardMode('submitted');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Thank you, ${name}! Your callback request has been prioritized with our Admissions & Enquiry Help Desk (+91 81053 88193 / +91 81230 40418 / +91 96320 70209). An admissions counselor will call you shortly on ${mob}.`,
        },
      ]);
    } catch (err) {
      console.error('Proactive callback error:', err);
      setProactiveError('Failed to submit callback request. Please try again.');
    } finally {
      setProactiveSubmitting(false);
    }
  };

  // Proactive 4th-Query Consultation Slot Submission
  const handleProactiveScheduleSubmit = async () => {
    const mob = proactiveMobile.trim();
    const cleanDigits = mob.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setProactiveError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setProactiveError('');
    setProactiveSubmitting(true);

    const name = proactiveName.trim() || leadStudentName || 'Prospective Student';
    const chosenSlot = proactiveSelectedSlot || '10:00 AM (Morning)';

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: name,
          mobile: mob,
          admissionClass: '12th Class (2nd PU) / 11th Class',
          inquiryType: 'Scheduled Consultation',
          queryTopic: `Consultation Slot: ${chosenSlot}`,
          chatNotes: `Booked consultation slot ${chosenSlot} after 4th query`,
          leadSource: 'proactive_time_slot_booking',
          sessionQueries: sessionQueriesRef.current,
        }),
      });
      const data = await res.json();
      const inqId = data?.inquiry?.id || `GPUC-2026-INQ-${Date.now().toString().slice(-4)}`;

      // Also book official appointment ticket
      const aptRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          mobile: mob,
          mode: 'campus_visit',
          inquiryId: inqId,
          date: 'Next Working Day',
          timeSlot: chosenSlot,
          purpose: 'Admissions Consultation & Campus Tour',
        }),
      });
      const aptData = await aptRes.json();
      const ticketId = aptData?.appointment?.id || `GPUC-VISIT-${Date.now().toString().slice(-4)}`;

      activeInquiryIdRef.current = inqId;
      setUserLead({
        inquiryId: inqId,
        studentName: name,
        mobile: mob,
        admissionClass: '12th Class (2nd PU) / 11th Class',
        inquiryType: 'Scheduled Consultation',
      });
      setLeadStudentName(name);
      setLeadMobile(mob);
      setProactiveCardMode('submitted');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Your consultation and campus visit has been scheduled for ${chosenSlot}.\n\nReference: ${ticketId}. Our Admissions & Enquiry Help Desk (+91 81053 88193 / +91 81230 40418 / +91 96320 70209) looks forward to meeting you.`,
          step: 'completed',
          ticketData: {
            id: ticketId,
            mode: 'campus_visit',
            date: 'Next Working Day',
            timeSlot: chosenSlot,
            venue: 'Gopalan Pre-University College, North Campus (Yelahanka)',
            studentName: name,
            mobile: mob,
            instructions: 'Present this reference or phone number at Admissions Desk on arrival.',
          },
        },
      ]);
    } catch (err) {
      console.error('Proactive schedule error:', err);
      setProactiveError('Failed to book time slot. Please try again.');
    } finally {
      setProactiveSubmitting(false);
    }
  };

  // Offline Booking: Generate Ticket & Record in Database
  const handleBookOfflineVisit = async () => {
    const currentLead = userLead || {
      inquiryId: 'GPUC-2026-INQ-1001',
      studentName: leadStudentName || 'Prospective Student',
      parentName: leadParentName,
      mobile: leadMobile || '9845012345',
      location: leadLocation,
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
        date: 'Monday to Saturday',
        timeSlot: '8:30 AM - 5:00 PM',
        meetingLinkOrVenue: 'Gopalan Pre-University College, North Campus (No. 79 Mavallipura, Hesaragatta Hobli, Yelahanka)',
      };

      setBookingFlowState('completed');

      const replyContent = `Your campus visit ticket has been generated and recorded with Reference ${apt.id}.\n\nVisiting hours are Monday to Saturday from 8:30 AM to 5:00 PM. Admissions Help Desk: +91 81053 88193 / +91 81230 40418 / +91 96320 70209.`;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: enforceMaxThreeLines(replyContent),
          step: 'completed',
          ticketData: {
            id: apt.id,
            mode: 'campus_visit',
            date: apt.date || 'Monday to Saturday',
            timeSlot: apt.timeSlot || '8:30 AM - 5:00 PM',
            venue: apt.meetingLinkOrVenue,
            studentName: currentLead.studentName,
            mobile: currentLead.mobile,
            instructions: 'Please present this ticket reference at the Admissions Desk upon arrival.',
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
          content: `Your campus visit has been noted! Please visit our North Campus from Monday to Saturday between 8:30 AM and 5:00 PM.\n\nYou may contact the Admissions & Enquiry Help Desk directly at +91 81053 88193 / +91 81230 40418 / +91 96320 70209.`,
          step: 'completed',
        },
      ]);
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Online Meeting: Request date & time from user (do not display availability the first time)
  const handleInitiateOnlineMeeting = async () => {
    const userMsg: Message = { role: 'user', content: 'Request an Online Meeting' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setLoading(true);

    const targetDate = customSlotDate || getTomorrowDateString();
    setCustomSlotDate(targetDate);
    setCustomSlotTime('10:00 AM');
    setBookingFlowState('asking_check_slot');

    await new Promise((res) => setTimeout(res, 800));

    const replyContent = `Please select your preferred date and time to check slot availability with our Admissions Department:`;

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: enforceMaxThreeLines(replyContent),
        step: 'ask_custom_slot',
      },
    ]);

    setIsTyping(false);
    setLoading(false);
  };

  // Check user requested slot with timetable and book or show open slots
  const handleCheckAndBookSlot = async (selDate: string, selTime: string) => {
    const currentLead = userLead || {
      inquiryId: 'GPUC-2026-INQ-1001',
      studentName: leadStudentName || 'Prospective Student',
      parentName: leadParentName,
      mobile: leadMobile || '9845012345',
      admissionClass: '12th Class (2nd PU)',
      inquiryType: 'Online Meeting',
    };

    const userMsg: Message = { role: 'user', content: `Check ${selDate} at ${selTime}` };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setLoading(true);

    try {
      const minWait = new Promise((res) => setTimeout(res, 1200));
      // 1. Check availability with admissions timetable
      const checkRes = await fetch(`/api/appointments?date=${encodeURIComponent(selDate)}&time=${encodeURIComponent(selTime)}`);
      const checkData = await checkRes.json();
      await minWait;

      if (checkData.available) {
        // Slot is available! Book immediately
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
        // Requested slot is unavailable! Now show available timetable slots
        const openSlots: Array<{ date: string; time: string; department: string }> =
          checkData.availableSlotsForDate && checkData.availableSlotsForDate.length > 0
            ? checkData.availableSlotsForDate
            : (checkData.availableSlots || []);

        setAvailableSlotsList(openSlots);
        setBookingFlowState('showing_available_slots');

        const replyContent = `The slot on ${selDate} at ${selTime} is currently booked.\n\nHere are the available time slots with our Admissions department for ${selDate}. Please select an open slot:`;

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: enforceMaxThreeLines(replyContent),
            step: 'show_available_slots',
            availableSlotsList: openSlots,
          },
        ]);
      }
    } catch (err) {
      console.error('Check and book slot error:', err);
      handleCannotAgreeDeskFallback();
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Fallback to Desk Helpline when user cannot find or agree to a slot
  const handleCannotAgreeDeskFallback = () => {
    setBookingFlowState('completed');
    setIsTyping(false);
    setLoading(false);

    const genericReply = `You can reach our Admissions & Enquiry Help Desk directly at +91 81053 88193 / +91 81230 40418 / +91 96320 70209 from 8:30 AM to 5:00 PM (Monday to Saturday).\n\nOur counseling team will be happy to assist you in coordinating your visit or scheduling a custom meeting slot.`;

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

    // Ephemeral session queries tracking (only stored in leads_chat_analysis.json if phone number is provided)
    sessionQueriesRef.current.push({
      query: text,
      timestamp: new Date().toISOString(),
    });

    // Handle user inputs during lead onboarding steps if user typed into the chat input:
    if (leadStep === 'ask_student_name') {
      const lower = text.toLowerCase().trim();
      if (lower === 'close' || lower === 'cancel' || lower === 'skip' || lower === 'x' || lower === 'no') {
        setInput('');
        handleCloseLead();
        return;
      }
      if (text.includes('?') || isPresetOrResemblingQuery(text) || text.length > 50) {
        setLeadStep('idle');
        setHasSkippedLead(true);
        setStepError('');
      } else {
        setInput('');
        handleStudentNameSubmit(text);
        return;
      }
    }

    if (leadStep === 'ask_contact') {
      const lower = text.toLowerCase().trim();
      if (lower === 'close' || lower === 'cancel' || lower === 'skip' || lower === 'x' || lower === 'no') {
        setInput('');
        handleCloseLead();
        return;
      }
      const digitsOnly = text.replace(/\D/g, '');
      if (digitsOnly.length >= 10) {
        setInput('');
        handleContactSubmit(undefined, digitsOnly, undefined);
        return;
      }
      if (text.includes('?') || isPresetOrResemblingQuery(text)) {
        setLeadStep('idle');
        setHasSkippedLead(true);
        setStepError('');
      }
    }

    if (leadStep === 'ask_admission') {
      const lower = text.toLowerCase().trim();
      if (lower === 'close' || lower === 'cancel' || lower === 'skip' || lower === 'x') {
        setInput('');
        handleCloseLead();
        return;
      }
      let chosenClass = '11th Class (1st PU)';
      let chosenType = 'Admissions 2026-27';

      if (lower.includes('12') || lower.includes('2nd')) {
        chosenClass = '12th Class (2nd PU)';
      } else if (lower.includes('11') || lower.includes('1st')) {
        chosenClass = '11th Class (1st PU)';
      } else if (lower.includes('visit') || lower.includes('campus') || lower.includes('tour')) {
        chosenClass = '11th/12th PU';
        chosenType = 'Campus Visit';
      } else {
        chosenClass = 'General PU';
        chosenType = 'Admissions 2026-27';
      }

      setInput('');
      handleAdmissionSubmit(chosenClass, chosenType);
      return;
    }

    // Handle user inputs during booking flow steps:
    if (bookingFlowState === 'offered_choice') {
      const lower = text.toLowerCase();
      if (lower.includes('offline') || lower.includes('campus') || lower.includes('visit') || lower.includes('in person')) {
        setInput('');
        handleBookOfflineVisit();
        return;
      }
      if (lower.includes('online') || lower.includes('meeting') || lower.includes('virtual') || lower.includes('call') || lower.includes('meet') || lower.includes('slot')) {
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

    if (bookingFlowState === 'asking_check_slot') {
      const lower = text.toLowerCase();
      if (lower.includes('call') || lower.includes('desk') || lower.includes('help') || lower.includes('no') || lower.includes("can't") || lower.includes('cannot') || lower.includes('cancel')) {
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        handleCannotAgreeDeskFallback();
        return;
      }
      setInput('');
      const targetDate = customSlotDate || getTomorrowDateString();
      handleCheckAndBookSlot(targetDate, text);
      return;
    }

    if (bookingFlowState === 'showing_available_slots') {
      const lower = text.toLowerCase();
      if (
        lower.includes('no') ||
        lower.includes('none') ||
        lower.includes('neither') ||
        lower.includes('cannot') ||
        lower.includes("can't") ||
        lower.includes('cancel') ||
        lower.includes('desk') ||
        lower.includes('help') ||
        lower.includes('call') ||
        lower.includes('still no')
      ) {
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        handleCannotAgreeDeskFallback();
        return;
      }
      setInput('');
      const targetDate = customSlotDate || getTomorrowDateString();
      handleCheckAndBookSlot(targetDate, text);
      return;
    }

    // Direct visit / meeting request when user specifies booking intent
    const lowerQuery = text.toLowerCase().trim();
    if (bookingFlowState !== 'offered_choice') {
      if (
        (lowerQuery.includes('campus visit') || lowerQuery.includes('book visit') || lowerQuery.includes('schedule visit') || lowerQuery.includes('offline visit') || lowerQuery.includes('visit campus')) &&
        !lowerQuery.includes('?')
      ) {
        setInput('');
        handleBookOfflineVisit();
        return;
      }
      if (
        (lowerQuery.includes('online meeting') || lowerQuery.includes('request meeting') || lowerQuery.includes('schedule meeting') || lowerQuery.includes('video call') || lowerQuery.includes('book slot') || lowerQuery.includes('schedule slot')) &&
        !lowerQuery.includes('?')
      ) {
        setInput('');
        handleInitiateOnlineMeeting();
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

    // Increment general question count & check 4th query trigger for proactive callback card
    generalQueryCountRef.current += 1;
    let shouldTriggerProactiveCard = false;
    if (!userLead && !leadMobile && !hasShownProactiveCardRef.current) {
      if (generalQueryCountRef.current === 4) {
        shouldTriggerProactiveCard = true;
        hasShownProactiveCardRef.current = true;
      }
    }

    // PRESET QUESTIONS OR RESEMBLING QUESTIONS:
    // Offer informative overview first, then offer student name input with skip option
    if (!userLead && !hasSkippedLead && isPresetOrResemblingQuery(text)) {
      const topic = getTopicFromQuery(text);
      setPendingQuery(text);
      setPendingTopic(topic);
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Bouncing dots for 1.2 seconds, then display informative answer + optional lead prompt
      setTimeout(() => {
        setIsTyping(false);
        setLeadStep('ask_student_name');

        const { overview, followUp } = getTopicOverview(text);

        const assistantPromptMsg: Message = {
          role: 'assistant',
          content: `${overview}\n\n${followUp}`,
          topic,
          step: 'ask_student_name',
          pendingQuery: text,
          isProactiveCallbackCard: shouldTriggerProactiveCard,
        };

        setMessages((prev) => [...prev, assistantPromptMsg]);
      }, 1200);

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

      const hasInquiry =
        data.toolCalls?.some((tc: any) => tc.tool === 'create_inquiry' || tc.name === 'create_inquiry') ||
        botContent.toLowerCase().includes('inquiry registered') ||
        botContent.toLowerCase().includes('inquiry has been registered') ||
        botContent.includes('GPUC-2026-INQ-');

      if (hasInquiry) {
        setBookingFlowState('offered_choice');
        setLeadStep('completed');
        if (data.toolCalls) {
          const inqCall = data.toolCalls.find(
            (tc: any) => (tc.tool === 'create_inquiry' || tc.name === 'create_inquiry') && tc.result?.inquiry_id
          );
          if (inqCall?.result?.inquiry_id) {
            activeInquiryIdRef.current = inqCall.result.inquiry_id;
            setUserLead((prev) => ({
              ...(prev || {
                studentName: leadStudentName || 'Prospective Student',
                mobile: leadMobile || '8989898989',
                admissionClass: '11th Class (1st PU)',
                inquiryType: 'Admissions 2026-27',
              }),
              inquiryId: inqCall.result.inquiry_id,
            }));
          }
        }
      }

      const replyContent =
        hasInquiry && !botContent.toLowerCase().includes('campus visit') && !botContent.toLowerCase().includes('meeting')
          ? `${botContent}\n\nWould you like to book a campus visit (offline) or request an online meeting?`
          : botContent;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyContent,
          toolCalls: data.toolCalls,
          step: hasInquiry ? 'offer_visit_or_online' : undefined,
          isProactiveCallbackCard: shouldTriggerProactiveCard,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sure, I will help you with your query about Gopalan PU College.\n\nYou may also contact our Admissions & Enquiry Help Desk directly at +91 81053 88193 / +91 81230 40418 / +91 96320 70209 or email gpuc.north@gopalanpucollege.com.`,
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
    setHasSkippedLead(false);
    setLeadStep('idle');
    setPendingQuery('');
    setPendingTopic('');
    setLeadStudentName('');
    setLeadParentName('');
    setLeadMobile('');
    setLeadLocation('');
    setStepStudentName('');
    setStepParentName('');
    setStepMobile('');
    setStepLocation('');
    setStepError('');
    setIsTyping(false);
    setLoading(false);
    setIsSubmittingLead(false);
    setBookingFlowState('idle');
    setAvailableSlotsList([]);
    setCustomSlotDate('');
    setCustomSlotTime('10:00 AM');
    sessionQueriesRef.current = [];
    generalQueryCountRef.current = 0;
    hasShownProactiveCardRef.current = false;
    activeInquiryIdRef.current = null;
    setProactiveCardMode('idle');
    setProactiveName('');
    setProactiveMobile('');
    setProactiveError('');
    setProactiveSubmitting(false);
  };

  const getInputPlaceholder = () => {
    if (bookingFlowState === 'offered_choice') return "Type 'offline' for visit or 'online' for meeting...";
    if (bookingFlowState === 'asking_check_slot') return "Select date & time above or type preferred time...";
    if (bookingFlowState === 'showing_available_slots') return "Select an available slot or type your time...";
    return "Ask anything about GPUC...";
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

  const handleWidgetClose = () => {
    try {
      sessionStorage.setItem('gpuc_ai_popped', 'true');
    } catch (e) {}
    setIsBouncing(false);
    if (isEmbedded) {
      window.parent?.postMessage({ type: 'GPUC_CHAT_CLOSE' }, '*');
    } else {
      setIsChatOpen(false);
    }
  };

  const handleWidgetMinimize = () => {
    try {
      sessionStorage.setItem('gpuc_ai_popped', 'true');
    } catch (e) {}
    setIsBouncing(false);
    if (isEmbedded) {
      window.parent?.postMessage({ type: 'GPUC_CHAT_MINIMIZE' }, '*');
    } else {
      setIsChatOpen(false);
    }
  };

  const handleWidgetMaximize = () => {
    if (isEmbedded) {
      window.parent?.postMessage({ type: 'GPUC_CHAT_MAXIMIZE' }, '*');
    }
    setIsMaximized((prev) => !prev);
  };

  return (
    <div
      className={isEmbedded ? 'is-embedded-chat' : ''}
      style={
        isEmbedded
          ? { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#FFFFFF' }
          : { position: 'relative', minHeight: '100vh', overflowX: 'hidden' }
      }
    >
      {/* Background: Actual Gopalan PU College Website (hidden when embedded) */}
      {!isEmbedded && <GpucWebsite onOpenChatWithQuery={(query) => handleSend(query)} />}

      {/* FLOATING CORNER CHATBOT WIDGET */}
      <div
        id="gpuc-ai-assistant-container"
        style={
          isEmbedded
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
              }
            : {
                position: 'fixed',
                bottom: 'var(--assistant-bottom, 20px)',
                right: 'var(--assistant-right, 20px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                maxWidth: '100vw',
                maxHeight: '100vh',
                pointerEvents: 'none',
              }
        }
      >
        {/* Floating Chatbot Circular Button (when chat is closed - responsive sizing, omitted in embedded mode) */}
        {!isChatOpen && !isEmbedded && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pointerEvents: 'auto' }}>
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

            {/* Gopalan Crest Icon Floating Circle (Responsive auto-scaling per device) */}
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('gpuc_ai_popped', 'true');
                } catch (e) {}
                setIsBouncing(false);
                setIsChatOpen(true);
              }}
              onAnimationEnd={() => {
                setIsBouncing(false);
                setIsChatOpen(true);
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={isBouncing ? 'gpuc-bouncing' : ''}
              aria-label="Open Gopalan PU College Assistant"
              style={{
                width: 'var(--assistant-bubble-size, 53px)',
                height: 'var(--assistant-bubble-size, 53px)',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '2.5px solid #F59E0B',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.4), 0 0 0 2.5px rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                padding: 0,
                pointerEvents: 'auto',
              }}
            >
              <img
                src="/gopalan_crest.svg"
                alt="Gopalan PU College"
                style={{
                  width: 'var(--assistant-crest-size, 37px)',
                  height: 'var(--assistant-crest-size, 37px)',
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
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  border: '2px solid #060D19',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
                }}
              />
            </button>
          </div>
        )}

        {/* EXPANDED CHAT WIDGET WINDOW */}
        {(isChatOpen || isEmbedded) && (
          <div
            id="gpuc-chat-window"
            className={`chat-widget-window ${isEmbedded ? 'is-embedded' : ''} ${isMaximized ? 'is-maximized' : ''}`}
            onWheel={(e) => {
              // Contain wheel events within the chat window so background page never scrolls
              e.stopPropagation();
            }}
            style={{
              width: isEmbedded
                ? '100%'
                : isMaximized
                ? 'min(1040px, calc(100vw - 36px))'
                : 'var(--assistant-width)',
              maxWidth: isEmbedded ? '100%' : 'calc(100vw - 16px)',
              height: isEmbedded
                ? '100%'
                : isMaximized
                ? 'calc(100vh - 40px)'
                : 'var(--assistant-height)',
              maxHeight: isEmbedded ? '100%' : 'calc(100dvh - 16px)',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              border: isEmbedded ? 'none' : '1px solid #E2E8F0',
              borderRadius: isEmbedded ? '0px' : isMaximized ? '20px' : 'var(--assistant-border-radius, 20px)',
              boxShadow: isEmbedded
                ? 'none'
                : isMaximized
                ? '0 24px 64px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.15)'
                : '0 16px 48px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.08)',
              animation: isEmbedded ? 'none' : 'fadeIn 0.25s ease-out',
              overflow: 'hidden',
              overscrollBehavior: 'contain',
              position: 'relative',
              pointerEvents: 'auto',
            }}
          >
            {/* Widget Header */}
            <div
              style={{
                flexShrink: 0,
                padding: '9px 12px',
                background: 'linear-gradient(135deg, #1E3A8A, #0F172A)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1.5px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/gopalan_crest.svg"
                    alt="GPUC Logo"
                    style={{
                      width: '19px',
                      height: '19px',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.2,
                    }}
                    title="GPUC — North Campus (Yelahanka)"
                  >
                    GPUC North Campus
                  </div>
                  <div
                    style={{
                      fontSize: '0.64rem',
                      color: '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px',
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }}></span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Yelahanka • Admissions 2026–27</span>
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
                {/* Reset button */}
                <button
                  onClick={handleReset}
                  title="Reset Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  <RotateCcw size={14} />
                </button>

                {/* Maximize / Restore Button */}
                <button
                  onClick={handleWidgetMaximize}
                  title={isMaximized ? 'Restore Standard Size' : 'Maximize Assistant'}
                  aria-label={isMaximized ? 'Restore Standard Size' : 'Maximize Assistant'}
                  style={{
                    background: isMaximized ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                    border: isMaximized ? '1px solid rgba(245, 158, 11, 0.55)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isMaximized ? '#FDE68A' : '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isMaximized ? '#FDE68A' : '#94A3B8')}
                >
                  {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {/* Minimize to circular launcher */}
                <button
                  onClick={handleWidgetMinimize}
                  title="Minimize Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  <Minus size={15} />
                </button>

                {/* Close Chat */}
                <button
                  onClick={handleWidgetClose}
                  title="Close Chat"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                >
                  <X size={15} />
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
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#F8FAFC',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: isMaximized ? '860px' : '100%',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
              {messages.map((msg, index) => {
                const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf('assistant');
                const isFormInputActive =
                  leadStep === 'ask_student_name' ||
                  leadStep === 'ask_contact' ||
                  leadStep === 'ask_admission' ||
                  (msg.step === 'ask_custom_slot' && bookingFlowState === 'asking_check_slot') ||
                  (msg.step === 'show_available_slots' && bookingFlowState === 'showing_available_slots');

                const showPresetsUnderMsg =
                  msg.role === 'assistant' &&
                  index === lastAssistantIdx &&
                  !isFormInputActive;

                return (
                  <div
                    key={index}
                    className="animate-fade-in"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: (msg.step || showPresetsUnderMsg) ? '100%' : '90%',
                      width: (msg.step || showPresetsUnderMsg) ? '100%' : 'auto',
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
                        padding: '10px 12px',
                        color: msg.role === 'user' ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0',
                        boxShadow: msg.role === 'user' ? '0 2px 8px rgba(30, 58, 138, 0.25)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                        width: (msg.step || showPresetsUnderMsg) ? '100%' : 'auto',
                        boxSizing: 'border-box',
                      }}
                      className={msg.role === 'user' ? 'prose-chat prose-chat-user' : 'prose-chat prose-chat-bot'}
                    >
                      {renderHighlightedContent(msg.content, msg.role === 'user')}

                      {/* Clickable Preset Quick Actions Grid (Uses full width in 2-column layout) */}
                      {showPresetsUnderMsg && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid #E2E8F0',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 700,
                              color: '#92400E',
                              marginBottom: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={12} color="#D97706" /> Popular Inquiries &amp; Services
                            </span>
                            <span style={{ fontSize: '0.64rem', color: '#64748B', fontWeight: 500 }}>
                              Tap to explore
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '6px',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                          >
                            {FAQ_PRESETS.map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleSend(preset.query)}
                                disabled={loading || isTyping}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '7px 8px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #FFFFFF, #FFFBEB)',
                                  border: '1.5px solid #FDE68A',
                                  color: '#78350F',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                                  boxShadow: '0 1px 3px rgba(245, 158, 11, 0.08)',
                                  gridColumn: pIdx === 4 && FAQ_PRESETS.length === 5 ? 'span 2' : 'auto',
                                  overflow: 'hidden',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#F59E0B';
                                  e.currentTarget.style.background = '#FEF3C7';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(245, 158, 11, 0.16)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#FDE68A';
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF, #FFFBEB)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.08)';
                                }}
                              >
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    background: '#FEF3C7',
                                    border: '1px solid #FCD34D',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.88rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  {preset.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      fontSize: '0.76rem',
                                      fontWeight: 650,
                                      color: '#92400E',
                                      lineHeight: 1.2,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {preset.title}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 1: Student Name Card */}
                      {msg.step === 'ask_student_name' && leadStep === 'ask_student_name' && (
                        <div
                          style={{
                            marginTop: '10px',
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
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={13} color="#D97706" /> Student Details (Step 1/3)
                            </span>
                            <button
                              type="button"
                              onClick={handleCloseLead}
                              aria-label="Close"
                              title="Close"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748B',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                              }}
                            >
                              <X size={15} />
                            </button>
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

                      {/* Step 2: Parent Name, Mobile & Location Card */}
                      {msg.step === 'ask_contact' && leadStep === 'ask_contact' && (
                        <div
                          style={{
                            marginTop: '10px',
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
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={13} color="#D97706" /> Contact & Location (Step 2/3)
                            </span>
                            <button
                              type="button"
                              onClick={handleCloseLead}
                              aria-label="Close"
                              title="Close"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748B',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                              }}
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {stepError && (
                            <div style={{ marginBottom: '8px', padding: '6px 10px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertCircle size={13} />
                              <span>{stepError}</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%', boxSizing: 'border-box' }}>
                            {/* 1. Parent / Guardian Name (with autoFocus) */}
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                                Parent / Guardian Name <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
                              </div>
                              <div style={{ position: 'relative' }}>
                                <input
                                  ref={parentInputRef}
                                  type="text"
                                  value={stepParentName}
                                  autoFocus
                                  onChange={(e) => setStepParentName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      mobileInputRef.current?.focus();
                                    }
                                  }}
                                  placeholder="Enter parent or guardian full name"
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '7px 10px 7px 32px',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    color: '#0F172A',
                                    fontSize: '0.82rem',
                                    outline: 'none',
                                  }}
                                />
                                <Users size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                              </div>
                            </div>

                            {/* 2. Mobile / WhatsApp Phone Number */}
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                                Mobile Number <span style={{ color: '#D97706', fontSize: '0.68rem', fontWeight: 600 }}>(Required)</span>
                              </div>
                              <div style={{ position: 'relative' }}>
                                <input
                                  ref={mobileInputRef}
                                  type="tel"
                                  value={stepMobile}
                                  maxLength={15}
                                  onChange={(e) => {
                                    setStepMobile(e.target.value);
                                    if (stepError) setStepError('');
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      locationInputRef.current?.focus();
                                    }
                                  }}
                                  placeholder="10-digit mobile number"
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '7px 10px 7px 32px',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    color: '#0F172A',
                                    fontSize: '0.82rem',
                                    outline: 'none',
                                  }}
                                />
                                <Phone size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                              </div>
                            </div>

                            {/* 3. Location: Area & Pincode */}
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                                Location / Area & Pincode <span style={{ color: '#94A3B8', fontWeight: 400 }}>(e.g. Whitefield 560066)</span>
                              </div>
                              <div style={{ position: 'relative' }}>
                                <input
                                  ref={locationInputRef}
                                  type="text"
                                  value={stepLocation}
                                  onChange={(e) => setStepLocation(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleContactSubmit();
                                    }
                                  }}
                                  placeholder="Enter your area & pincode (e.g. Whitefield 560066)"
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '7px 10px 7px 32px',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    color: '#0F172A',
                                    fontSize: '0.82rem',
                                    outline: 'none',
                                  }}
                                />
                                <MapPin size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleContactSubmit()}
                              className="btn-primary"
                              style={{
                                marginTop: '4px',
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '8px 14px',
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
                      {(msg.step === 'ask_admission' || msg.content?.includes('12th Class (2nd PU) or 11th Class (1st PU)')) && leadStep === 'ask_admission' && (
                        <div
                          style={{
                            marginTop: '10px',
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
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={13} color="#D97706" /> Choose Option (Step 3/3)
                            </span>
                            <button
                              type="button"
                              onClick={handleCloseLead}
                              aria-label="Close"
                              title="Close"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748B',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                              }}
                            >
                              <X size={15} />
                            </button>
                          </div>

                          <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '8px' }}>
                            Tap an option below to register:
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: '6px',
                              width: '100%',
                              boxSizing: 'border-box',
                            }}
                          >
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('11th Class (1st PU)', 'Admissions 2026-27')}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: '#EFF6FF',
                                border: '1.5px solid #3B82F6',
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
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
                              }}
                            >
                              🎒 11th Class (1st PU)
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('12th Class (2nd PU)', 'Admissions 2026-27')}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                background: '#FEF3C7',
                                border: '1.5px solid #F59E0B',
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
                                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)',
                              }}
                            >
                              🎓 12th Class (2nd PU)
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('11th/12th PU', 'Campus Visit')}
                              style={{
                                padding: '8px 6px',
                                textAlign: 'center',
                                background: '#F0FDF4',
                                border: '1px solid #22C55E',
                                color: '#166534',
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                borderRadius: '8px',
                                cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                width: '100%',
                                boxSizing: 'border-box',
                              }}
                            >
                              🏫 Campus Visit
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingLead}
                              onClick={() => handleAdmissionSubmit('General PU', 'Admissions 2026-27')}
                              style={{
                                padding: '8px 6px',
                                textAlign: 'center',
                                background: '#F1F5F9',
                                border: '1px solid #94A3B8',
                                color: '#334155',
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                borderRadius: '8px',
                                cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.25,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                width: '100%',
                                boxSizing: 'border-box',
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
                      {(msg.step === 'offer_visit_or_online' ||
                        msg.leadInquiryId ||
                        msg.toolCalls?.some((tc: any) => tc.tool === 'create_inquiry' && tc.result?.success) ||
                        (msg.content && msg.content.includes('inquiry registered') && !msg.content.includes('ticket has been generated'))) &&
                        bookingFlowState !== 'completed' &&
                        bookingFlowState !== 'asking_check_slot' &&
                        bookingFlowState !== 'showing_available_slots' &&
                        !msg.ticketData && (
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
                                    Tour North Campus (Yelahanka) &bull; Instant visit ticket
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

                      {/* Step: Ask User to Check Preferred Date & Time (Do not display availability the first time) */}
                      {msg.step === 'ask_custom_slot' && bookingFlowState === 'asking_check_slot' && (
                        <div
                          style={{
                            marginTop: '10px',
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
                            <Calendar size={13} color="#2563EB" /> Check Consultation Slot Availability
                          </div>

                          <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '10px' }}>
                            Select your preferred date and 30-minute consultation window to check availability with our Admissions team:
                          </div>

                          {/* Date and Time Selectors */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                                Preferred Date:
                              </label>
                              <input
                                type="date"
                                min={getTomorrowDateString()}
                                value={customSlotDate || getTomorrowDateString()}
                                onChange={(e) => setCustomSlotDate(e.target.value)}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '7px 10px',
                                  borderRadius: '7px',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.8rem',
                                  color: '#0F172A',
                                  background: '#F8FAFC',
                                  outline: 'none',
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                                Preferred 30-Min Time Slot:
                              </label>
                              <select
                                value={customSlotTime}
                                onChange={(e) => setCustomSlotTime(e.target.value)}
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  padding: '7px 10px',
                                  borderRadius: '7px',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.8rem',
                                  color: '#0F172A',
                                  background: '#F8FAFC',
                                  outline: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <optgroup label="Morning (9:00 AM – 12:30 PM)">
                                  <option value="09:00 AM">09:00 AM</option>
                                  <option value="09:30 AM">09:30 AM</option>
                                  <option value="10:00 AM">10:00 AM</option>
                                  <option value="10:30 AM">10:30 AM</option>
                                  <option value="11:00 AM">11:00 AM</option>
                                  <option value="11:30 AM">11:30 AM</option>
                                  <option value="12:00 PM">12:00 PM</option>
                                  <option value="12:30 PM">12:30 PM</option>
                                </optgroup>
                                <optgroup label="Afternoon (2:00 PM – 5:00 PM)">
                                  <option value="02:00 PM">02:00 PM</option>
                                  <option value="02:30 PM">02:30 PM</option>
                                  <option value="03:00 PM">03:00 PM</option>
                                  <option value="03:30 PM">03:30 PM</option>
                                  <option value="04:00 PM">04:00 PM</option>
                                  <option value="04:30 PM">04:30 PM</option>
                                  <option value="05:00 PM">05:00 PM</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleCheckAndBookSlot(customSlotDate || getTomorrowDateString(), customSlotTime)}
                              style={{
                                width: '100%',
                                padding: '9px 12px',
                                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
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
                                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                              }}
                            >
                              <Check size={14} /> Check Availability & Book Slot
                            </button>

                            <button
                              type="button"
                              disabled={loading || isTyping}
                              onClick={() => handleCannotAgreeDeskFallback()}
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                background: '#FFF1F2',
                                color: '#BE123C',
                                border: '1px solid #FECDD3',
                                borderRadius: '7px',
                                fontWeight: 600,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                              }}
                            >
                              <Phone size={13} /> Prefer to speak directly &bull; Admissions Help Desk
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step: Show Available Time Slots when requested slot was booked */}
                      {msg.step === 'show_available_slots' && bookingFlowState === 'showing_available_slots' && (
                        <div
                          style={{
                            marginTop: '10px',
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
                              <Clock size={13} color="#D97706" /> Available Timetable Slots
                            </span>
                            <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                              Open Slots
                            </span>
                          </div>

                          <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '10px' }}>
                            The slot you requested is taken. Please select any open slot below to confirm your booking:
                          </div>

                          {/* Available Slots Grid */}
                          {availableSlotsList.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
                              {availableSlotsList.map((slot, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  disabled={loading || isTyping}
                                  onClick={() => handleCheckAndBookSlot(slot.date, slot.time)}
                                  style={{
                                    padding: '8px 4px',
                                    background: '#EFF6FF',
                                    border: '1.5px solid #3B82F6',
                                    borderRadius: '7px',
                                    color: '#1E40AF',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.76rem', color: '#64748B', fontStyle: 'italic', marginBottom: '10px' }}>
                              All slots for this day are currently filled.
                            </div>
                          )}

                          {/* Fallback to Help Desk if user still cannot agree */}
                          <button
                            type="button"
                            disabled={loading || isTyping}
                            onClick={() => handleCannotAgreeDeskFallback()}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: '#FFF1F2',
                              color: '#BE123C',
                              border: '1.5px solid #FECDD3',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Phone size={13} /> None of these work for me &bull; Help Desk Details
                          </button>
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

                      {/* Proactive 4th-Query Action Card */}
                      {msg.isProactiveCallbackCard && !userLead && proactiveCardMode !== 'dismissed' && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: 'linear-gradient(135deg, #FFFFFF, #FFFBEB)',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <PhoneCall size={13} color="#D97706" /> GPUC NORTH ADMISSIONS HELP
                            </span>
                            <button
                              type="button"
                              onClick={() => setProactiveCardMode('dismissed')}
                              aria-label="Dismiss"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div style={{ fontSize: '0.80rem', fontWeight: 650, color: '#78350F', lineHeight: 1.45, marginBottom: '10px' }}>
                            Can we request an immediate callback to help you out with GPUC North, or would you like to schedule a call / campus visit from our available time slots?
                          </div>

                          {proactiveCardMode === 'idle' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setProactiveCardMode('immediate_callback');
                                  setProactiveError('');
                                }}
                                style={{
                                  width: '100%',
                                  padding: '9px 12px',
                                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.80rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                                }}
                              >
                                <PhoneCall size={13} /> 📞 Request Immediate Callback
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setProactiveCardMode('schedule_call');
                                  setProactiveError('');
                                }}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  background: '#FFFFFF',
                                  color: '#92400E',
                                  border: '1.5px solid #F59E0B',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Calendar size={13} /> 📅 Pick a Time Slot
                              </button>
                            </div>
                          )}

                          {proactiveCardMode === 'immediate_callback' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                              <div style={{ fontSize: '0.72rem', color: '#78350F', fontWeight: 600 }}>
                                Enter your name &amp; phone number for an immediate priority callback:
                              </div>

                              {proactiveError && (
                                <div style={{ padding: '5px 8px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <AlertCircle size={12} /> {proactiveError}
                                </div>
                              )}

                              <input
                                type="text"
                                value={proactiveName}
                                onChange={(e) => setProactiveName(e.target.value)}
                                placeholder="Student / Parent Name"
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.80rem',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  outline: 'none',
                                }}
                              />

                              <input
                                type="tel"
                                maxLength={15}
                                value={proactiveMobile}
                                onChange={(e) => {
                                  setProactiveMobile(e.target.value);
                                  if (proactiveError) setProactiveError('');
                                }}
                                placeholder="10-digit Mobile Number *"
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #F59E0B',
                                  fontSize: '0.82rem',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  fontWeight: 600,
                                  outline: 'none',
                                }}
                              />

                              <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  disabled={proactiveSubmitting}
                                  onClick={handleProactiveCallbackSubmit}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '7px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    cursor: proactiveSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <Check size={13} /> {proactiveSubmitting ? 'Submitting...' : 'Call Me Now'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProactiveCardMode('idle')}
                                  style={{
                                    padding: '8px 12px',
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Back
                                </button>
                              </div>
                            </div>
                          )}

                          {proactiveCardMode === 'schedule_call' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                              <div style={{ fontSize: '0.72rem', color: '#78350F', fontWeight: 600 }}>
                                Select your preferred call / visit time slot:
                              </div>

                              {proactiveError && (
                                <div style={{ padding: '5px 8px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <AlertCircle size={12} /> {proactiveError}
                                </div>
                              )}

                              <input
                                type="text"
                                value={proactiveName}
                                onChange={(e) => setProactiveName(e.target.value)}
                                placeholder="Student / Parent Name"
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  fontSize: '0.80rem',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  outline: 'none',
                                }}
                              />

                              <input
                                type="tel"
                                maxLength={15}
                                value={proactiveMobile}
                                onChange={(e) => {
                                  setProactiveMobile(e.target.value);
                                  if (proactiveError) setProactiveError('');
                                }}
                                placeholder="10-digit Mobile Number *"
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #F59E0B',
                                  fontSize: '0.82rem',
                                  background: '#FFFFFF',
                                  color: '#0F172A',
                                  fontWeight: 600,
                                  outline: 'none',
                                }}
                              />

                              <div style={{ fontSize: '0.70rem', color: '#78350F', fontWeight: 700 }}>
                                Available Consultation Window:
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
                                {['10:00 AM (Morning)', '11:30 AM (Morning)', '02:30 PM (Afternoon)', '04:30 PM (Evening)'].map((slot, sIdx) => {
                                  const isSelected = proactiveSelectedSlot === slot;
                                  return (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      onClick={() => setProactiveSelectedSlot(slot)}
                                      style={{
                                        padding: '6px 4px',
                                        borderRadius: '6px',
                                        border: isSelected ? '2px solid #D97706' : '1px solid #CBD5E1',
                                        background: isSelected ? '#FEF3C7' : '#FFFFFF',
                                        color: isSelected ? '#92400E' : '#334155',
                                        fontWeight: isSelected ? 700 : 500,
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                      }}
                                    >
                                      {slot}
                                    </button>
                                  );
                                })}
                              </div>

                              <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                                <button
                                  type="button"
                                  disabled={proactiveSubmitting}
                                  onClick={handleProactiveScheduleSubmit}
                                  style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '7px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    cursor: proactiveSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <Calendar size={13} /> {proactiveSubmitting ? 'Booking...' : 'Confirm Call Slot'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProactiveCardMode('idle')}
                                  style={{
                                    padding: '8px 12px',
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Back
                                </button>
                              </div>
                            </div>
                          )}

                          {proactiveCardMode === 'submitted' && (
                            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '10px', color: '#166534', fontSize: '0.78rem' }}>
                              <div style={{ fontWeight: 700, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Check size={14} color="#16A34A" /> Request Successfully Confirmed!
                              </div>
                              <div>
                                Our Admissions Help Desk (+91 81053 88193) will connect with you on <strong>{proactiveMobile}</strong>.
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admissions Help Desk Contact Card */}
                      {msg.step === 'completed' && (msg.content.includes('+91 81053 88193') || msg.content.includes('+91 81230 40418') || msg.content.includes('+91 96320 70209') || msg.content.includes('+91 96069 41908')) && !msg.ticketData && (
                        <div
                          style={{
                            marginTop: '10px',
                            background: '#FFFDF5',
                            border: '1.5px solid #F59E0B',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Phone size={13} color="#D97706" /> ADMISSIONS &amp; ENQUIRY HELP DESK
                            </span>
                            <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 700 }}>
                              NORTH CAMPUS
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                            {[
                              { label: 'Help Desk 1', number: '+91 81053 88193', tel: '+918105388193' },
                              { label: 'Help Desk 2', number: '+91 81230 40418', tel: '+918123040418' },
                              { label: 'Help Desk 3', number: '+91 96320 70209', tel: '+919632070209' },
                            ].map((h, hIdx) => (
                              <div
                                key={hIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  background: '#FFFFFF',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #FDE68A',
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: '0.66rem', color: '#78350F', fontWeight: 600 }}>{h.label}</div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>{h.number}</div>
                                </div>
                                <a
                                  href={`tel:${h.tel}`}
                                  style={{
                                    padding: '5px 10px',
                                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                    color: '#FFFFFF',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Phone size={11} /> Call
                                </a>
                              </div>
                            ))}
                          </div>

                          <div style={{ fontSize: '0.72rem', color: '#78350F', lineHeight: 1.45 }}>
                            🕒 <strong>Working Hours:</strong> Monday &ndash; Saturday, 8:30 AM &ndash; 5:00 PM<br />
                            📍 <strong>Campus:</strong> No. 79 Mavallipura, Hesaragatta Hobli, Yelahanka<br />
                            ✉️ <strong>Email:</strong> gpuc.north@gopalanpucollege.com
                          </div>
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
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Horizontal Presets Bar */}
            {messages.length > 1 &&
              leadStep !== 'ask_student_name' &&
              leadStep !== 'ask_contact' &&
              leadStep !== 'ask_admission' &&
              bookingFlowState !== 'asking_check_slot' &&
              bookingFlowState !== 'showing_available_slots' && (
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMaximized ? 'center' : 'flex-start',
                  gap: '5px',
                  overflowX: 'auto',
                  overscrollBehavior: 'contain',
                  padding: '5px 10px 3px',
                  background: '#FFFFFF',
                  borderTop: '1px solid #F1F5F9',
                  scrollbarWidth: 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    maxWidth: isMaximized ? '860px' : 'none',
                    width: isMaximized ? '100%' : 'auto',
                    overflowX: 'auto',
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
                        fontSize: '0.70rem',
                        padding: '4px 8px',
                        whiteSpace: 'nowrap',
                        background: '#FFFDF5',
                        border: '1px solid #FDE68A',
                        color: '#92400E',
                        fontWeight: 600,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                flexShrink: 0,
                padding: '8px 10px',
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: isMaximized ? '860px' : '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
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
                  <Send size={16} />
                </button>
              </div>
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
