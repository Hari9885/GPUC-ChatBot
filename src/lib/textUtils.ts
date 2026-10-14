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
    cleaned = "Admission requires passing 10th standard (Karnataka SSLC, CBSE, or ICSE).\n\nFor the document checklist and further questions, please call our Admissions help desk at +91 96069 41908 (Monday to Friday, 8:30 AM to 5:00 PM) or visit our Whitefield campus.";
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
