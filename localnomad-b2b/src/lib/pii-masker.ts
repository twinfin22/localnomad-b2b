// PII masking pipeline for chatbot messages
// Detects and replaces PII (passport, ARC, RRN, phone, email) before sending to Claude API

interface MaskEntry {
  placeholder: string;
  original: string;
}

interface MaskResult {
  masked: string;
  entries: MaskEntry[];
}

// Order matters: process most distinctive patterns first to avoid false overlaps
// email → RRN → ARC → phone → passport

const PII_PATTERNS: { name: string; regex: RegExp; prefix: string }[] = [
  // Email: standard email pattern
  {
    name: 'email',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    prefix: 'EMAIL',
  },
  // RRN (주민등록번호): exactly 6 digits + hyphen + 7 digits
  // Negative lookbehind/ahead prevents matching other digit sequences
  {
    name: 'rrn',
    regex: /(?<!\d)\d{6}-\d{7}(?!\d)/g,
    prefix: 'RRN',
  },
  // ARC (외국인등록번호): same format as RRN (6+7 digits) — caught by RRN pattern
  // ARC-specific pattern: starts with digit sequence typical of foreigner registration
  {
    name: 'arc',
    regex: /(?<!\d)\d{6}-[5-8]\d{6}(?!\d)/g,
    prefix: 'ARC',
  },
  // Korean phone: 01X-XXXX-XXXX format (with or without hyphens)
  {
    name: 'phone_kr',
    regex: /01[016789]-?\d{3,4}-?\d{4}/g,
    prefix: 'PHONE',
  },
  // International phone: +CC-XXXX-XXXX format
  {
    name: 'phone_intl',
    regex: /\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
    prefix: 'PHONE',
  },
  // Passport: single uppercase letter followed by 7-9 digits
  // Negative lookbehind prevents matching visa codes like D-2-2
  {
    name: 'passport',
    regex: /(?<![-\w])[A-Z]\d{7,9}(?!\d)/g,
    prefix: 'PASSPORT',
  },
];

/**
 * Mask all PII in a text string.
 * Returns the masked text and a list of entries for later unmasking.
 *
 * False-positive prevention:
 * - Visa codes (D-2-2, D-4-1) are NOT masked because the passport regex
 *   requires no preceding dash or word character
 * - Dates (2024-01-15) are NOT masked because they don't match 6+7 digit pattern
 * - Student IDs (20240001) are NOT masked because passport regex requires
 *   an uppercase letter prefix
 */
export const maskPii = (text: string): MaskResult => {
  const entries: MaskEntry[] = [];
  let masked = text;
  let counter = 0;

  for (const pattern of PII_PATTERNS) {
    masked = masked.replace(pattern.regex, (match) => {
      counter++;
      const placeholder = `[${pattern.prefix}_${counter}]`;
      entries.push({ placeholder, original: match });
      return placeholder;
    });
  }

  return { masked, entries };
};

/**
 * Restore original PII values from placeholders.
 * Used to unmask the AI response if it references masked placeholders.
 */
export const unmaskPii = (text: string, entries: MaskEntry[]): string => {
  let unmasked = text;
  for (const entry of entries) {
    unmasked = unmasked.replaceAll(entry.placeholder, entry.original);
  }
  return unmasked;
};

/**
 * Check if a text string contains any PII.
 * Useful for validation before sending to external APIs.
 */
export const containsPii = (text: string): boolean => {
  for (const pattern of PII_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) {
      return true;
    }
  }
  return false;
};
