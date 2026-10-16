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
