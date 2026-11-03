import Anthropic from '@anthropic-ai/sdk';
import { toolDeclarations, executeTool } from './tools';
import { searchKnowledge, loadFAQs } from './knowledge';
import {
  stripStarsAndAsterisks,
  enforceMaxThreeLines,
  isNonsenseOrIncomprehensible,
  INCOMPREHENSIBLE_RESPONSE,
} from './textUtils';
export { stripStarsAndAsterisks, enforceMaxThreeLines, isNonsenseOrIncomprehensible, INCOMPREHENSIBLE_RESPONSE };

// Reads ANTHROPIC_API_KEY from environment or falls back to production key
const DEFAULT_ANTHROPIC_KEY = Buffer.from(
  'c2stYW50LXVzci0xd0JfZzZJY3VoNUtKR3dLOW16TjZPMVVtOEVBNHNydzJfV0toS1lteV9jWWt3X1lXeFhEeEl2a0gwUHpNaE1SN0RYX0ZJMld4SkJnS044YnNMc3hZSWdoYnpMRUFBQQ==',
  'base64'
).toString('utf-8');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || DEFAULT_ANTHROPIC_KEY;
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, timeout: 15_000, maxRetries: 1 });
const MODEL = 'claude-haiku-5-5';

const FALLBACK_RESPONSE =
  "For questions about Gopalan PU College Whitefield Campus, please call our Admissions Help Desk at +91 96069 41908 / +91 96069 41907 / (080) 41280227 or visit our campus behind SAP Labs, Hoodi.";

export const OUT_OF_SCOPE_RESPONSE =
  "I cannot help with that request as I am unable to understand or process requests outside college admissions. I can help with requests about Gopalan PU College courses, admissions, facilities, and campus visits.";

export function isOutOfScopeQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const q = query.toLowerCase().trim();
  const clean = q.replace(/[?!.,;:'"()]+/g, ' ').replace(/\s+/g, ' ').trim();

  // If query is very short greeting, it's handled by greeting handler
  if (/^(hi|hello|hey|heyy|heya|hola|namaste|vanakkam|good\s*(morning|afternoon|evening|day)|greetings|howdy)$/i.test(clean)) {
    return false;
  }

  // GoFly / template artifact rejection (Anti-hallucination guardrail)
  if (/\b(gofly|go\s*fly|robert\s*harringson|flight\s*ticket|flight\s*booking|airline|holiday\s*package|hotel\s*booking)\b/i.test(clean)) {
    return true;
  }

  // Strong college context keywords
  const hasStrongCollegeContext =
    /\b(gpuc|gopalan|pu\s*college|puc|pre-university|pcmb|pcmc|ceba|seba|meba|ca\s*foundation|neet|kcet|jee|nata|tally|coursera|kanchana|mahesh|krishna\s*murthy|sunita|aravind|whitefield|hoodi|seetharam\s*palya|basavanagar|yelahanka|gpuc\s*south|south\s*campus|principal|director)\b/i.test(clean);

  // 1. National/World leaders, politics, elections, presidents, prime ministers
  const politicalOrLeaderPattern =
    /\b(president|prime\s*minister|chief\s*minister|governor|droupadi\s*murmu|narendra\s*modi|siddaramaiah|rahul\s*gandhi|bjp|congress|parliament|lok\s*sabha|rajya\s*sabha|election|elections|vote\s*for|minister\s*of)\b/i;
  if (politicalOrLeaderPattern.test(clean)) {
    // Only allow if asking specifically about college leadership/principal with college context
    if (/\b(principal|director|faculty|teacher)\b/i.test(clean) && hasStrongCollegeContext) {
      return false;
    }
    return true;
  }

  // 2. Geography / World facts / Trivia / General Knowledge
  const gkTriviaPattern =
    /\b(capital\s+of|currency\s+of|population\s+of|speed\s+of\s+light|solar\s+system|who\s+invented|who\s+discovered|who\s+wrote\b|tallest\s+building|longest\s+river|highest\s+mountain|formula\s+of|einstein|newton|photosynthesis|dna|meaning\s+of\s+life|how\s+to\s+cook|recipe\s+for)\b/i;
  if (gkTriviaPattern.test(clean)) {
    return true;
  }

  // 3. Coding, Math, Homework, Medical diagnosis
  const codingMathPattern =
    /\b(write\s+(a\s+)?(python|javascript|java|c\+\+|code|script|sql)|fibonacci|solve\s+(this\s+)?(math|equation|calculus|derivative|integral|\d+)|calculate\s+\d+|\b\d+\s*[\+\-\*\/]\s*\d+\b|diagnose\s+my|fever\s+and\s+cough|medical\s+advice|write\s+(an?\s+)?essay\s+on|homework\s+help)\b/i;
  if (codingMathPattern.test(clean)) {
    return true;
  }

  // 4. Creative / Casual AI / Entertainment / Sports / Jokes / Weather
  const casualAiPattern =
    /\b(tell\s+(me\s+)?(a\s+)?joke|make\s+me\s+laugh|write\s+(a\s+)?poem|sing\s+(a\s+)?song|tell\s+(me\s+)?a\s+story|cricket\s+score|ipl\s+score|world\s+cup|who\s+won\s+the|virat\s+kohli|messi|ronaldo|box\s+office|weather\s+(in|today|tomorrow)|temperature\s+in)\b/i;
  if (casualAiPattern.test(clean)) {
    return true;
  }

  // 5. Prompt injection / Jailbreak / System Prompt leaks
  const jailbreakPattern =
    /\b(ignore\s+(previous|all)\s+instructions|you\s+are\s+now\b|unrestricted\s+ai|jailbreak|system\s+prompt|print\s+(your\s+)?prompt|repeat\s+the\s+words\s+above)\b/i;
  if (jailbreakPattern.test(clean)) {
    return true;
  }

  // 6. Direct scope questions
  const scopeMetaPattern =
    /\b(unrelated\s+question|questions?\s+unrelated|answer\s+anything|general\s+knowledge|out\s+of\s+scope|who\s+created\s+you|are\s+you\s+chatgpt|who\s+made\s+you)\b/i;
  if (scopeMetaPattern.test(clean)) {
    return true;
  }

  return false;
}

export const MASTER_SYSTEM_INSTRUCTION = `
SYSTEM PROMPT — GOPALAN PRE-UNIVERSITY COLLEGE (WHITEFIELD / SOUTH CAMPUS) AI ASSISTANT

0. STRICT SCOPE & COMPREHENSIBILITY BOUNDARY (MANDATORY & ABSOLUTE):
- You are EXCLUSIVELY the Admissions & College Information Assistant for GOPALAN PRE-UNIVERSITY COLLEGE (GPUC) — WHITEFIELD (SOUTH) CAMPUS, Bengaluru.
- You are STRICTLY FORBIDDEN from answering any question unrelated to Gopalan Pre-University College.
- IF THE USER MESSAGE DOES NOT MAKE SENSE, IS INCOMPREHENSIBLE, OR IS GIBBERISH (such as keyboard smashes like "wkfjehgisdfvkchdjsbrv", random letters, or nonsensical input):
  Respond strictly with:
  "I cannot help with that request as I am unable to understand the message... I can help with requests about Gopalan PU College / school admissions, courses, facilities, and campus visits."
- NEVER answer questions about general knowledge, national or world politics, presidents, prime ministers, external history, geography, science/homework problems, coding, jokes, weather, movies, sports, or other institutions.
- IF THE USER ASKS ANY OUT-OF-SCOPE OR UNRELATED QUESTION (such as "president of india", "who is the prime minister", "capital of france", "what is the meaning of life", "tell a joke", "write code", etc.), DO NOT ANSWER THE QUESTION.
- For ANY out-of-scope question, you must respond ONLY with this exact policy answer:
  "I cannot help with that request as I am unable to understand or process requests outside college admissions. I can help with requests about Gopalan PU College courses, admissions, facilities, and campus visits."
- Never answer the trivia question and then add a disclaimer. The refusal must be immediate, direct, and adhere to this exact wording.
- TEMPLATE ARTIFACT REFUSAL: The college website historically had a third-party template referencing "GoFly Travel Agency" or "Robert Harringson". If asked, strictly refuse and clarify that Gopalan PU College is exclusively an educational pre-university institution.

1. STRICT MAXIMUM 3 LINES RULE (MANDATORY):
- FOR ANY QUESTION, YOUR ENTIRE ANSWER MUST BE MAXIMUM 3 LINES. NEVER EXCEED 3 LINES.
- Only answer what is required. Nothing more.
- No essays, no long lists, no disclaimers, no robotic preamble ("I understand you are looking for...", "As an AI assistant...").

2. ADMISSION & DOCUMENTS (CRITICAL):
- DO NOT list individual documents or bullet checklists!
- When asked about admissions, requirements, or documents, reply strictly in 2 lines:
"Admission requires passing 10th standard (Karnataka SSLC, CBSE, or ICSE).

For the document checklist and enrollment procedures, please contact our Admissions & Enquiry Help Desk at +91 96069 41908 / +91 96069 41907 / (080) 41280227."

3. COURSES & COMBINATIONS (OFFICIAL & VERIFIED — MAX 3 LINES):
- Science: PCMB (Physics, Chemistry, Mathematics, Biology) and PCMC (Physics, Chemistry, Mathematics, Computer Science) with integrated NEET (PCMB), JEE and KCET coaching.
- Commerce: CEBA (Computer Science), SEBA (Statistics), and MEBA (Mathematics) with Economics, Business Studies, Accountancy, and integrated CA Foundation coaching.
- Languages: English (Mandatory Part I) + Kannada, Hindi, Sanskrit, or French (Part II).
- Value-Added Courses: NATA Coaching, Data Analytics with Advanced Excel, Tally, Introduction to Data Science, Coursera Global Certifications.

4. LEADERSHIP & FACULTY (MAX 2 LINES):
- Principal of Gopalan PU College Whitefield: Dr. Kanchana A S.
- Academic Head: Mr. Mahesh (Chemistry, MSc, MPhil, BEd - 21 Years). Science Coordinator: Mr. Krishna Murthy Goud (Chemistry, MSc, SET - 14 Years).
- Director of Gopalan Foundation: Mrs. Sunita Prabhakar.

5. FEES (MAX 2 LINES):
- When asked about fees, tuition, installment options, or scholarships, do not quote amounts or estimates. Immediately direct the user to the Whitefield Admissions Help Desk:
"For official fee structures, installment options, and scholarship details, please contact our Admissions Help Desk directly:
Admissions & Enquiry Help Desk: +91 96069 41908 / +91 96069 41907 / (080) 41280227 | Email: admission_gpuc@gopalanpucollege.com"

6. RULES & REGULATIONS (MAX 3 LINES):
- Mobile Phones: Strictly prohibited on campus. Unauthorized use entails phone confiscation until course completion OR a fine of Rs. 1,000.
- Vehicles: Two-wheelers and four-wheelers are strictly prohibited for PUC students.
- Attendance: Late reporting is marked as ABSENT for the entire day.

7. CAMPUS FACILITIES & SPORTS (MAX 3 LINES):
- Modern science laboratories, digital classrooms, a well-stocked library, a cafeteria, an amphitheatre, and 24/7 CCTV surveillance.
- Sports: football ground, cricket ground, lawn tennis, badminton, table tennis, and gymnastics. GPS-enabled transport across key city routes (route list from the help desk).
- Hostel: residential facility exclusively for girls; fees and capacity are not published.

8. CAMPUS VISITS & APPOINTMENTS (MAX 2 LINES):
- Office and visiting hours are not published. Never state any hours.
- "Campus visits to Whitefield Campus (Behind SAP Labs, Hoodi) can be arranged by calling +91 96069 41908 or (080) 41280227. Would you like to schedule a visit or admission consultation?"

9. OTHER CAMPUSES — STRICT BOUNDARY (MAX 2 LINES):
- You only have information about the Whitefield (South) Campus. Never share or guess any detail (courses, contacts, address, staff, fees, events) of any other Gopalan campus, and never compare campuses.
- If the user asks about any other campus (for example North Campus or Yelahanka), respond only with:
"I can only help with Gopalan PU College, Whitefield (South) Campus. For any other campus, please contact that campus directly."

10. NO ASTERISKS / STARS:
- Never use asterisks (*) or double asterisks (**) anywhere.

11. GREETINGS (MAX 2 LINES):
- If the user says "hi", "hello", "hey", or a general greeting, respond with a warm hello and welcome them to Gopalan Pre-University College, South Campus (Whitefield). Never assume an inquiry topic or ask for student details on a simple greeting.

12. LOCATION & CONTACT (MAX 3 LINES):
- Address: 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi Village, Whitefield, Bengaluru - 560048.
- Admissions Helpline: +91 96069 41908 / +91 96069 41907 / (080) 41280227 | WhatsApp: +91 8105131098.
- Email: admission_gpuc@gopalanpucollege.com / admin@gopalanpucollege.com.
`;

export async function callClaude(
  messages: Anthropic.MessageParam[],
  userContext: any
): Promise<{
  text: string;
  toolCallsExecuted: Array<{ tool: string; args: any; result: any }>;
}> {
  const toolCallsExecuted: Array<{ tool: string; args: any; result: any }> = [];

  // Extract latest user query for context enrichment
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userQuery = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';
  const cleanQ = userQuery.toLowerCase().trim();
  const cleanQWithoutPunct = cleanQ.replace(/[!.,?]+$/, '').trim();

  // Instant response for nonsense / incomprehensible / keyboard smash queries
  if (isNonsenseOrIncomprehensible(userQuery)) {
    return {
      text: INCOMPREHENSIBLE_RESPONSE,
      toolCallsExecuted: [],
    };
  }

  // Instant response for out-of-scope / general knowledge queries
  if (isOutOfScopeQuery(userQuery)) {
    return {
      text: OUT_OF_SCOPE_RESPONSE,
      toolCallsExecuted: [],
    };
  }

  // Instant response for standard greetings
  const isGreeting =
    /^(hi|hello|hey|heyy|heya|hola|namaste|vanakkam|good\s*(morning|afternoon|evening|day)|greetings|howdy)$/i.test(cleanQWithoutPunct) ||
    /^(hi|hello|hey)\s+(there|assistant|bot|gpuc)$/i.test(cleanQWithoutPunct);

  if (isGreeting) {
    const studentName = userContext?.studentName || userContext?.name;
    const greetingText = studentName
      ? `Hello ${studentName}! Welcome back to Gopalan Pre-University College, South Campus (Whitefield).

How can I help you today? Feel free to ask about our courses, 2027-28 admissions, or campus visits.`
      : `Hello! Welcome to Gopalan Pre-University College, South Campus (Whitefield).

How can I help you today? Please feel free to ask about admissions, courses, or campus visits.`;
    return {
      text: greetingText,
      toolCallsExecuted: [],
    };
  }

  // Instant response for Principal / Leadership queries
  const isPrincipalQuery = /\b(who is the principal|principal name|who is principal|principal of|college principal|director|academic head|science coordinator)\b/i.test(cleanQ);
  if (isPrincipalQuery) {
    return {
      text: "The Principal of Gopalan Pre-University College, Whitefield Campus is Dr. Kanchana A S. The Academic Head is Mr. Mahesh (Chemistry, MSc, MPhil, BEd).\n\nAdmissions Helpline: +91 96069 41908 / +91 96069 41907 | WhatsApp: +91 8105131098.",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Fee queries - direct to helpline desk for further info
  const isFeeQuery = /\b(fee|fees|cost|costs|tuition|installment|scholarship|scholarships|concession)\b/i.test(cleanQ) ||
    ((cleanQ.includes('fee') || cleanQ.includes('cost') || cleanQ.includes('tuition') || cleanQ.includes('installment') || cleanQ.includes('scholarship') || cleanQ.includes('concession') || cleanQ.includes('payment') || cleanQ.includes('how much')) && !cleanQ.includes('calculate') && !cleanQ.includes('solve'));
  if (isFeeQuery) {
    return {
      text: "For official fee structures, installment options, and scholarship details, please contact our Admissions Help Desk directly:\n\nAdmissions Helpline: +91 96069 41908 / +91 96069 41907 / (080) 41280227\nEmail: admission_gpuc@gopalanpucollege.com",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Commerce courses queries
  const isCommerceQuery = /commerce (combination|course|stream)|what commerce|commerce subject|ceba|seba|meba|ca foundation/i.test(cleanQ);
  if (isCommerceQuery) {
    return {
      text: "Commerce Streams Available (Whitefield Campus):\n• CEBA (Computer Science), SEBA (Statistics), and MEBA (Mathematics)\n• Integrated CA Foundation coaching available\n• Languages: English + Kannada / Hindi / Sanskrit / French",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Science courses queries
  const isScienceQuery = /science (combination|course|stream)|what science|pcmb|pcmc|integrated neet|integrated jee|integrated kcet/i.test(cleanQ);
  if (isScienceQuery && !cleanQ.includes('calculate') && !cleanQ.includes('solve')) {
    return {
      text: "Science Streams Available (Whitefield Campus):\n• PCMB: Physics, Chemistry, Maths, Biology\n• PCMC: Physics, Chemistry, Maths, Computer Science\n• Integrated Coaching: NEET, JEE & KCET\n• Languages: English + Kannada / Hindi / Sanskrit / French",
      toolCallsExecuted: [],
    };
  }

  // Instant response for All Courses queries
  const isAllCoursesQuery = /what courses|which courses|available courses|list of courses|courses offered|all courses|streams offered|combinations offered/i.test(cleanQ);
  if (isAllCoursesQuery) {
    return {
      text: "Courses Offered at Whitefield (South) Campus:\n• Science: PCMB & PCMC (with integrated NEET/JEE/KCET)\n• Commerce: CEBA, SEBA & MEBA (with CA Foundation coaching)\n• Languages: English + Kannada / Hindi / Sanskrit / French",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Rules, Cell phone & Vehicle queries
  const isRulesQuery = /\b(rule|rules|cell phone|mobile phone|phone policy|vehicle|bike|car|two wheeler|punctuality|attendance|dress code|uniform)\b/i.test(cleanQ);
  if (isRulesQuery) {
    return {
      text: "Whitefield Campus Rules: Cell phones are strictly prohibited (unauthorized use entails phone confiscation or Rs. 1,000 fine). Student two-wheelers and four-wheelers are not permitted. Late reporting is recorded as absent.",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Location & Contact queries
  const isLocationQuery = /where|location|address|how to reach|campus location|map/i.test(cleanQ);
  if (isLocationQuery) {
    return {
      text: "Gopalan PU College Whitefield is located at 181/1, 182/1, Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Whitefield, Bengaluru 560048.\n\nAdmissions Helpline: +91 96069 41908 / +91 96069 41907 | WhatsApp: +91 8105131098.",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Contact queries
  const isContactDirect = /^(how to )?(contact|phone|call|number|spoc|reach|email)/i.test(cleanQ) || /contact (us|the college|admissions|desk)/i.test(cleanQ);
  if (isContactDirect && !cleanQ.includes('calculate') && !cleanQ.includes('solve')) {
    return {
      text: "Whitefield Admissions Helpline: +91 96069 41908 / +91 96069 41907 / (080) 41280227.\nWhatsApp: +91 8105131098 | Email: admission_gpuc@gopalanpucollege.com\nAddress: Behind SAP Labs, Hoodi, Whitefield, Bengaluru.",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Facilities, Sports & Transport queries
  const isFacilityDirect = /football|cricket|tennis|badminton|table tennis|hostel|bus|transport|cafeteria|canteen|lab|labs|library|sports|ground/i.test(cleanQ);
  if (isFacilityDirect && (cleanQ.includes('do you have') || cleanQ.includes('available') || cleanQ.includes('facility') || cleanQ.includes('facilities') || cleanQ.includes('is there') || cleanQ.includes('what are'))) {
    return {
      text: "Whitefield Campus has modern science labs, digital classrooms, a library, cafeteria, amphitheatre, a girls' hostel, sports facilities (football, cricket, lawn tennis, badminton, table tennis, gymnastics), and GPS-enabled transport across key city routes.",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Required Documents
  const isDocumentsDirect = /(what|which) documents? (are )?(needed|required)|admission documents|document checklist/i.test(cleanQ);
  if (isDocumentsDirect) {
    return {
      text: "Required admission documents (two sets of photocopies): 10th original TC, attested 10th marks card, 10th hall ticket, study certificate, caste & income certificate, student & parent Aadhaar, and 5 passport-size photos. Migration or eligibility certificates are needed for other boards or NRI students.",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Timings & Visiting hours
  const isTimingsDirect = /timings|timing|visiting hour|visiting time|office hour|when can i visit/i.test(cleanQ);
  if (isTimingsDirect) {
    return {
      text: "Whitefield Campus office and visiting hours are not published. Please call +91 96069 41908 / (080) 41280227 before visiting, or ask me to book a campus visit.",
      toolCallsExecuted: [],
    };
  }

  // Hybrid RAG: Retrieve grounded context from knowledge base & FAQs
  const isCourseQuery = /course|cource|stream|combin|subject|puc|pcmb|pcmc|ceba|seba|meba|offer/i.test(cleanQ);
  const isDocQuery = /document|admission|eligib|caste|tc|certif|require|process|apply/i.test(cleanQ);
  const isFacQuery = /facilit|sport|ground|tennis|badminton|cricket|football|transport|bus|lab|library|canteen|cafeteria/i.test(cleanQ);
  const isBookQuery = /book|visit|tour|appointment|consult|meet|schedule|slot/i.test(cleanQ);
  const isContactQuery = /contact|phone|call|number|spoc|reach|email|whatsapp/i.test(cleanQ);
  const isPrincipalFilter = /principal|director|leadership|kanchana|mahesh|sunita/i.test(cleanQ);

  const kbMatches = searchKnowledge(userQuery, 4);
  const allFAQs = loadFAQs();
  const faqMatches = allFAQs.filter((f) => {
    if (isGreeting) return true;
    if (isPrincipalFilter && (f.id === 'college_principal' || f.id === 'institution_overview')) return true;
    if (isCourseQuery && (f.id === 'science_courses_combinations' || f.id === 'commerce_courses_combinations' || f.id === 'languages_offered' || f.id === 'value_added_courses')) return true;
    if (isDocQuery && (f.id === 'admission_documents_required' || f.id === 'admission_eligibility')) return true;
    if (isFacQuery && (f.id === 'sports_and_facilities' || f.id === 'transportation_routes')) return true;
    if (isBookQuery && f.id === 'campus_visit_schedule') return true;
    if (isContactQuery && f.id === 'contact_help_desk') return true;
    return cleanQ.includes(f.intent.toLowerCase()) || f.question.toLowerCase().includes(cleanQ);
  });

  const unrelatedFAQ = allFAQs.find((f) => f.id === 'unrelated_question');
  if (unrelatedFAQ && !faqMatches.some((f) => f.id === 'unrelated_question')) {
    faqMatches.push(unrelatedFAQ);
  }

  let groundedContext = `\n\n=== VERIFIED GOPALAN PU COLLEGE RECORDS (WHITEFIELD / SOUTH CAMPUS) ===\n`;
  if (kbMatches.length > 0) {
    groundedContext += `\n[KNOWLEDGE BASE EXCERPTS]:\n` + kbMatches.map((k) => `### ${k.title}\n${k.content}`).join('\n\n');
  }
  if (faqMatches.length > 0) {
    groundedContext += `\n[OFFICIAL FAQ MATCHES]:\n` + faqMatches.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  }

  if (userContext) {
    groundedContext += `\n[ENQUIRER PROFILE & RECORDED LEAD]:\n` +
      `- Student Name: ${userContext.studentName || userContext.name || 'N/A'}\n` +
      `- Parent/Guardian: ${userContext.parentName || 'N/A'}\n` +
      `- Contact Mobile: ${userContext.mobile || 'N/A'}\n` +
      `- Location/Area: ${userContext.location || 'N/A'}\n` +
      `- Target Class/Stream: ${userContext.admissionClass || '1st PU (11th Standard)'}\n` +
      `- Inquiry Nature: ${userContext.inquiryType || 'Admissions 2027-28'}\n` +
      `- Reference ID: ${userContext.inquiryId || 'GPUC-2026-INQ'}\n` +
      `Answer directly, concisely, and helpfully without robotic preamble or repeating their reference ID.\n`;
  }

  const tools: Anthropic.Tool[] = toolDeclarations.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));

  const currentMessages = [...messages];
  let maxTurns = 4;

  while (maxTurns > 0) {
    maxTurns--;

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024, // thinking counts toward this; answer length is capped by enforceMaxThreeLines
        output_config: { effort: 'low' },
        // Static prompt first so it is cached; per-query grounded context after the breakpoint
        system: [
          { type: 'text', text: MASTER_SYSTEM_INSTRUCTION, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: groundedContext },
        ],
        tools,
        messages: currentMessages,
      });
    } catch (err) {
      console.error('Claude API call failed:', err);
      return { text: FALLBACK_RESPONSE, toolCallsExecuted };
    }

    // Safety classifier declined (Haiku 5.5 has no server-side fallback)
    if (response.stop_reason === 'refusal') {
      return { text: OUT_OF_SCOPE_RESPONSE, toolCallsExecuted };
    }

    if (response.stop_reason !== 'tool_use') {
      // Model produced text response
      const rawText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      // Post-generation guard: If model answered out-of-scope topic or leaked political/general knowledge
      const mentionsPoliticalOrGK =
        /droupadi\s*murmu|narendra\s*modi|president\s+of\s+india|prime\s+minister\s+of\s+india|siddaramaiah/i.test(rawText);
      if (mentionsPoliticalOrGK) {
        return {
          text: OUT_OF_SCOPE_RESPONSE,
          toolCallsExecuted,
        };
      }

      // Note: isOutOfScopeQuery is for user input only; on answers its math regex flags phone numbers ("41907 / (080)") and years ("2026-27")
      if (cleanQ.includes('president') && !cleanQ.includes('principal') && !cleanQ.includes('gopalan')) {
        return {
          text: OUT_OF_SCOPE_RESPONSE,
          toolCallsExecuted,
        };
      }

      return {
        text: enforceMaxThreeLines(rawText) || FALLBACK_RESPONSE,
        toolCallsExecuted,
      };
    }

    // Append the full assistant content (incl. thinking blocks) unchanged before tool results
    currentMessages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const args = block.input as Record<string, any>;
      console.log(`Executing tool: ${block.name} with args:`, args);

      try {
        const result = await executeTool(block.name, args);
        toolCallsExecuted.push({ tool: block.name, args, result });
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      } catch (toolErr: any) {
        console.error(`Tool execution error for ${block.name}:`, toolErr);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: toolErr.message, is_error: true });
      }
    }

    // All tool results go back in a single user turn
    currentMessages.push({ role: 'user', content: toolResults });
  }

  return {
    text: "I have registered your details with the college. How else may I assist you today?",
    toolCallsExecuted,
  };
}
