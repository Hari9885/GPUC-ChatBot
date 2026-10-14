import { toolDeclarations, executeTool } from './tools';
import { searchKnowledge, loadFAQs } from './knowledge';
import { stripStarsAndAsterisks, enforceMaxThreeLines } from './textUtils';
export { stripStarsAndAsterisks, enforceMaxThreeLines };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Priority order with resilient fallbacks
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: any[];
}

export const MASTER_SYSTEM_INSTRUCTION = `
SYSTEM PROMPT — GOPALAN PRE-UNIVERSITY COLLEGE AI ASSISTANT

1. STRICT MAXIMUM 3 LINES RULE (MANDATORY):
- FOR ANY QUESTION, YOUR ENTIRE ANSWER MUST BE MAXIMUM 3 LINES. NEVER EXCEED 3 LINES.
- Only answer what is required. Nothing more.
- No essays, no long lists, no disclaimers, no robotic preamble ("I understand you are looking for...", "As an AI assistant...").

2. ADMISSION & DOCUMENTS (CRITICAL):
- DO NOT list individual documents or bullet checklists!
- When asked about admissions, requirements, or documents, reply strictly in 2 lines:
"Admission requires passing 10th standard (Karnataka SSLC, CBSE, or ICSE).

For the document checklist and further questions, please call our Admissions help desk at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM) or visit our Whitefield campus."

3. COURSES & COMBINATIONS (OFFICIAL & VERIFIED — MAX 3 LINES):
- Science: PCMB and PCMC with integrated NEET (for PCMB) and JEE/KCET coaching (for PCMB & PCMC).
- Commerce: CEBA, SEBA, MEBA, and structured CA Foundation coaching.
- Languages: English (Mandatory I Language) and Kannada, Hindi, Sanskrit, or French (II Language options).
- When asked about courses, answer directly in 2-3 lines with these exact combinations.

4. FEES (MAX 2 LINES):
- "Tuition fees depend on the chosen stream per Karnataka PU Board norms. For the exact 2026-27 fee schedule, please call our help desk at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM)."

5. HOSTEL & FACILITIES (MAX 3 LINES):
- "Our campus features modern science labs, library, sports grounds, cafeteria, and a secure girls' hostel. You are welcome to visit our campus in Whitefield to tour the facilities."

6. CAMPUS VISITS & APPOINTMENTS (MAX 2 LINES):
- "Campus visits are available Monday to Saturday between 9:00 AM and 4:00 PM. Would you like to schedule a visit?"

7. NO ASTERISKS / STARS:
- Never use asterisks (*) or double asterisks (**) anywhere.

8. GREETINGS (MAX 2 LINES):
- If the user says "hi", "hello", "hey", or a general greeting, respond with a warm hello and welcome them to Gopalan Pre-University College. Never assume an inquiry topic or ask for student details on a simple greeting.

9. LOCATION & CONTACT (MAX 2 LINES):
- When asked "where is it located", address, location, or contact details, reply directly in 2 lines:
"Gopalan Pre-University College is located in Whitefield, Bengaluru (Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Bengaluru 560048).

Admissions Help Desk: +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM)."
`;

export async function callGemini(
  messages: ChatMessage[],
  userContext?: any,
  temperature = 0.3
): Promise<{
  text: string;
  toolCallsExecuted: Array<{ tool: string; args: any; result: any }>;
}> {
  const toolCallsExecuted: Array<{ tool: string; args: any; result: any }> = [];

  // Extract latest user query for context enrichment
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userQuery = lastUserMsg?.parts?.[0]?.text || '';
  const cleanQ = userQuery.toLowerCase().trim();
  const cleanQWithoutPunct = cleanQ.replace(/[!.,?]+$/, '').trim();

  // Instant response for standard greetings
  const isGreeting =
    /^(hi|hello|hey|heyy|heya|hola|namaste|vanakkam|good\s*(morning|afternoon|evening|day)|greetings|howdy)$/i.test(cleanQWithoutPunct) ||
    /^(hi|hello|hey)\s+(there|assistant|bot|gpuc)$/i.test(cleanQWithoutPunct);

  if (isGreeting) {
    const studentName = userContext?.studentName || userContext?.name;
    const greetingText = studentName
      ? `Hello ${studentName}! Welcome back to Gopalan Pre-University College.\n\nHow can I help you today? Feel free to ask about our courses, admissions for 2026-27, or campus facilities.`
      : `Hello! Welcome to Gopalan Pre-University College.\n\nHow can I help you today? Please feel free to ask any question regarding admissions, courses, or campus visits.`;
    return {
      text: greetingText,
      toolCallsExecuted: [],
    };
  }

  // Instant response for Location & Contact queries
  const isLocationQuery = /where|location|address|how to reach|campus location|map/i.test(cleanQ);
  if (isLocationQuery) {
    return {
      text: "Gopalan Pre-University College is located in Whitefield, Bengaluru (Behind SAP Labs, Seetharam Palya, Basavanagar, Hoodi, Bengaluru 560048).\n\nAdmissions Help Desk: +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM).",
      toolCallsExecuted: [],
    };
  }

  // Instant response for Fee queries
  const isFeeQuery = /fee|fees|cost|scholarship|tuition/i.test(cleanQ);
  if (isFeeQuery) {
    return {
      text: "Tuition fees depend on the chosen stream per Karnataka PU Board norms.\n\nFor the exact 2026-27 fee schedule, please call our help desk at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM).",
      toolCallsExecuted: [],
    };
  }

  // Hybrid RAG: Retrieve grounded context from knowledge base & FAQs
  const isCourseQuery = /course|cource|stream|combin|subject|puc|pcmb|pcmc|ceba|seba|meba|offer/i.test(cleanQ);
  const isDocQuery = /document|admission|eligib|caste|tc|certif|require|process|apply/i.test(cleanQ);
  const isFacQuery = /facilit|hostel|sport|ground|transport|bus|lab|library|canteen|cafeteria/i.test(cleanQ);
  const isBookQuery = /book|visit|tour|appointment|consult|meet|schedule|slot/i.test(cleanQ);
  const isContactQuery = /contact|phone|call|number|spoc|reach|email/i.test(cleanQ);

  const kbMatches = searchKnowledge(userQuery, 4);
  const allFAQs = loadFAQs();
  const faqMatches = allFAQs.filter((f) => {
    if (isGreeting) return true;
    if (isCourseQuery && (f.id === 'science_combinations' || f.id === 'commerce_combinations' || f.id === 'languages')) return true;
    if (isDocQuery && (f.id === 'admission_documents' || f.id === 'admission_eligibility')) return true;
    if (isFacQuery && f.id === 'facilities') return true;
    if (isBookQuery && f.id === 'appointment') return true;
    if (isContactQuery && f.id === 'contact') return true;
    return cleanQ.includes(f.intent.toLowerCase()) || f.question.toLowerCase().includes(cleanQ);
  });

  let groundedContext = `\n\n=== VERIFIED GOPALAN PU COLLEGE RECORDS ===\n`;
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
      `- Target Class/Stream: ${userContext.admissionClass || '12th Class (2nd PU)'}\n` +
      `- Inquiry Nature: ${userContext.inquiryType || 'Admissions 2026-27'}\n` +
      `- Reference ID: ${userContext.inquiryId || 'GPUC-2026-INQ'}\n` +
      `Answer directly, concisely, and helpfully without robotic preamble or repeating their reference ID.\n`;
  }

  // Convert declarations to Gemini API format
  const geminiTools = [
    {
      functionDeclarations: toolDeclarations.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];

  let currentMessages = [...messages];
  let maxTurns = 4;

  while (maxTurns > 0) {
    maxTurns--;
    let lastError: any = null;
    let data: any = null;

    // Try candidate models in order until one responds
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: MASTER_SYSTEM_INSTRUCTION + groundedContext }],
            },
            contents: currentMessages,
            tools: geminiTools,
            generationConfig: {
              temperature,
              maxOutputTokens: 140,
            },
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          lastError = errData;
          continue; // try next model
        }

        data = await res.json();
        if (data?.candidates?.[0]?.content) {
          break; // success!
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!data?.candidates?.[0]?.content) {
      console.error('All Gemini candidate models failed:', lastError);
      return {
        text: "For questions about Gopalan PU College, please call our Admissions help desk at +91 96069 41908 or visit our campus.",
        toolCallsExecuted,
      };
    }

    const candidate = data.candidates[0];
    const parts = candidate.content.parts || [];

    // Check for function calls
    const functionCalls = parts.filter((p: any) => p.functionCall);

    if (functionCalls.length === 0) {
      // Model produced text response
      const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
      return {
        text: enforceMaxThreeLines(textParts.join('\n') || ''),
        toolCallsExecuted,
      };
    }

    // Process function calls: IMPORTANT - Preserve candidate.content intact so thoughtSignature is not lost!
    currentMessages.push(candidate.content);

    const functionResponseParts = [];
    for (const fcPart of functionCalls) {
      const { name, args } = fcPart.functionCall;
      console.log(`Executing tool: ${name} with args:`, args);

      try {
        const result = await executeTool(name, args);
        toolCallsExecuted.push({ tool: name, args, result });

        functionResponseParts.push({
          functionResponse: {
            name,
            response: { content: result },
          },
        });
      } catch (toolErr: any) {
        console.error(`Tool execution error for ${name}:`, toolErr);
        functionResponseParts.push({
          functionResponse: {
            name,
            response: { content: { error: toolErr.message } },
          },
        });
      }
    }

    // Append function responses in user turn as expected by Gemini API
    currentMessages.push({
      role: 'user',
      parts: functionResponseParts,
    });
  }

  return {
    text: "I have registered your details with the college. How else may I assist you today?",
    toolCallsExecuted,
  };
}
