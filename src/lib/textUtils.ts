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

export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
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

export interface AvailableWorkingDay {
  dateStr: string;
  dayName: string;
  dateFormatted: string;
  displayLabel: string;
  shortDate: string;
  isToday: boolean;
}

export function getAvailableWorkingDays(): AvailableWorkingDay[] {
  const days: AvailableWorkingDay[] = [];
  const today = new Date();

  // Gather up to 7 working days, starting from today (on the left corner)
  // Saturday and Sunday are off and NOT included
  for (let d = 0; d <= 14 && days.length < 7; d++) {
    const target = new Date(today);
    target.setDate(today.getDate() + d);

    // Skip Saturday (6) and Sunday (0)
    const dayOfWeek = target.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = target.toISOString().split('T')[0];
    const dayNameRaw = target.toLocaleDateString('en-US', { weekday: 'short' });
    const dayName = `${dayNameRaw}.`;
    const dayNum = String(target.getDate()).padStart(2, '0');
    const monthNum = String(target.getMonth() + 1).padStart(2, '0');
    const dateFormatted = `${dayNum}/${monthNum}`;
    const monthName = target.toLocaleDateString('en-US', { month: 'short' });

    const isToday = d === 0;
    const displayLabel = isToday
      ? `Today (${dayNameRaw}, ${target.getDate()} ${monthName})`
      : `${dayNameRaw}, ${target.getDate()} ${monthName}`;

    days.push({
      dateStr,
      dayName,
      dateFormatted,
      displayLabel,
      shortDate: `${target.getDate()} ${monthName}`,
      isToday,
    });
  }

  return days;
}

export function validatePersonName(raw: string): { valid: boolean; cleanName: string; error?: string } {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    return { valid: false, cleanName: '', error: 'Name cannot be empty.' };
  }
  if (/\d/.test(trimmed)) {
    return { valid: false, cleanName: trimmed, error: 'Name must contain only letters (no numbers).' };
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return { valid: false, cleanName: trimmed, error: 'Name must contain only letters.' };
  }
  const letterCount = trimmed.replace(/[^a-zA-Z]/g, '').length;
  if (letterCount < 2) {
    return { valid: false, cleanName: trimmed, error: 'Please enter a valid name (at least 2 letters).' };
  }
  return { valid: true, cleanName: trimmed };
}

export function validateIndianMobile(raw: string): { valid: boolean; cleanDigits: string; formatted: string; error?: string } {
  const digits = (raw || '').replace(/\D/g, '');
  let clean = digits;
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.slice(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.slice(1);
  }

  if (clean.length !== 10) {
    return {
      valid: false,
      cleanDigits: clean,
      formatted: `+91 ${clean}`,
      error: 'Please enter a valid 10-digit mobile number.',
    };
  }

  if (!/^[6-9]/.test(clean)) {
    return {
      valid: false,
      cleanDigits: clean,
      formatted: `+91 ${clean}`,
      error: 'Mobile number must start with 6, 7, 8, or 9 (e.g. 6362xxxxxx, 7372xxxxxx). Numbers starting with 5, 4, 3, etc. are not accepted.',
    };
  }

  return {
    valid: true,
    cleanDigits: clean,
    formatted: `+91 ${clean}`,
  };
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

