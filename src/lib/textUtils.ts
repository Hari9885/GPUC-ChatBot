export function stripStarsAndAsterisks(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*{2,3}(.*?)\*{2,3}/g, '$1')
    .replace(/^[\t ]*\*+\s+/gm, '• ')
    .replace(/\*/g, '')
    .replace(/[ \t]{2,}/g, ' ');
}

export function formatPhoneNumbers(text: string): string {
  if (!text) return '';
  // Bind country code +91 and 10-digit phone numbers with non-breaking spaces
  return text
    .replace(/(\+91)\s+(\d{5})\s+(\d{5})/g, '$1\u00A0$2\u00A0$3')
    .replace(/(\+91)\s+(\d{10})/g, '$1\u00A0$2');
}

export function enforceMaxThreeLines(text: string): string {
  if (!text) return '';
  let cleaned = stripStarsAndAsterisks(text).trim();

  // If text mentions document checklist items or bulky lists
  if (
    /transfer certificate|marks card|study certificate|aadhaar|hall ticket|migration certificate/i.test(cleaned)
  ) {
    cleaned = "Admission requires passing 10th standard (Karnataka SSLC, CBSE, or ICSE).\n\nFor the document checklist and enrollment procedures, please contact our Admissions & Enquiry Help Desk at +91 81053 88193 / +91 81230 40418 / +91 96320 70209 (Monday to Saturday, 8:30 AM to 5:00 PM).";
    return formatPhoneNumbers(cleaned);
  }

  // Ensure clean paragraph separation between sentences if merged together
  cleaned = cleaned.replace(/(\.|\?)\s+(For\s+|Please\s+|Would you\s+|Our\s+|Languages\s+)/g, '$1\n\n$2');

  const rawLines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
  if (rawLines.length <= 3) {
    return formatPhoneNumbers(rawLines.join('\n\n'));
  }

  return formatPhoneNumbers(rawLines.slice(0, 3).join('\n\n'));
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) {
    // If tomorrow is Sunday, skip to Monday
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  return tomorrow.toISOString().split('T')[0];
}

export const INCOMPREHENSIBLE_RESPONSE =
  "I cannot help with that request as I am unable to understand the message... I can help with requests about Gopalan PU College / school admissions, courses, facilities, and campus visits.";

const KNOWN_ACRONYMS = new Set([
  'pcmb',
  'pcmc',
  'ceba',
  'seba',
  'meba',
  'kcet',
  'neet',
  'jee',
  'gpuc',
  'puc',
  'sslc',
  'cbse',
  'icse',
  'nri',
  'pu',
]);

export function isNonsenseOrIncomprehensible(query: string): boolean {
  if (!query || typeof query !== 'string') return true;
  const t = query.trim();
  if (t.length === 0) return true;

  // Single or two-letter random consonants (not 'hi', 'no', 'ok', etc.)
  if (/^[b-df-hj-np-tv-z]{2,}$/i.test(t)) return true;

  // Repetitive single character (e.g. 'aaaaaa', 'zzzzzz')
  if (/^(.)\1{4,}$/i.test(t)) return true;

  // Check individual words
  const words = t.split(/\s+/).filter(Boolean);
  let nonsenseWordsCount = 0;

  for (const w of words) {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (KNOWN_ACRONYMS.has(cleanWord)) continue;

    if (cleanWord.length >= 5) {
      // 5+ consecutive consonants (e.g., 'kchdjsbrv', 'dfghjk')
      if (/[b-df-hj-np-tv-z]{5,}/i.test(cleanWord)) {
        nonsenseWordsCount++;
        continue;
      }
      // Vowel ratio check (< 12% vowels in >= 6 chars)
      const vowels = cleanWord.match(/[aeiou]/g) || [];
      const vowelRatio = vowels.length / cleanWord.length;
      if (vowelRatio < 0.12 && cleanWord.length >= 6) {
        nonsenseWordsCount++;
        continue;
      }
      // Typical keyboard smashes
      if (/^(asdf|qwer|zxcv|hjkl|dfgh|fghj|jkl|cvbn)/i.test(cleanWord) && cleanWord.length >= 6) {
        nonsenseWordsCount++;
        continue;
      }
    }
  }

  if (words.length > 0 && nonsenseWordsCount === words.length) {
    return true;
  }
  if (words.length <= 3 && nonsenseWordsCount >= 1) {
    return true;
  }

  return false;
}

