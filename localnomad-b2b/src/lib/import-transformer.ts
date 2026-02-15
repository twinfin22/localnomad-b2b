// Pure data transformation utilities for the import pipeline.
// No DB or Prisma dependencies — all functions are stateless and side-effect-free.

// --- Reverse lookup maps (Korean → enum value) ---

const ENROLLMENT_STATUS_REVERSE: Record<string, string> = {
  '재학': 'ENROLLED',
  '휴학': 'ON_LEAVE',
  '제적': 'EXPELLED',
  '자퇴': 'WITHDRAWN',
  '졸업': 'GRADUATED',
  '미등록': 'UNREGISTERED',
};

const PROGRAM_TYPE_REVERSE: Record<string, string> = {
  '전문학사': 'ASSOCIATE',
  '학사': 'BACHELOR',
  '석사': 'MASTER',
  '박사': 'DOCTORATE',
  '어학연수': 'LANGUAGE',
};

const INSURANCE_STATUS_REVERSE: Record<string, string> = {
  '유효': 'ACTIVE',
  '만료 임박': 'EXPIRING',
  '만료임박': 'EXPIRING',
  '만료': 'EXPIRED',
  '미가입': 'NONE',
  '없음': 'NONE',
};

// --- Valid enum sets (matching Prisma schema) ---

const VALID_VISA_TYPES = new Set([
  'D_2_1',
  'D_2_2',
  'D_2_3',
  'D_2_4',
  'D_2_5',
  'D_2_6',
  'D_2_7',
  'D_2_8',
  'D_4_1',
  'D_4_7',
]);

const VALID_ENROLLMENT = new Set([
  'ENROLLED',
  'ON_LEAVE',
  'EXPELLED',
  'WITHDRAWN',
  'GRADUATED',
  'UNREGISTERED',
]);

const VALID_PROGRAM = new Set([
  'ASSOCIATE',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
  'LANGUAGE',
]);

const VALID_INSURANCE = new Set(['ACTIVE', 'EXPIRING', 'EXPIRED', 'NONE']);

// --- Parse functions ---

/**
 * Normalize visa type strings into the Prisma enum format.
 * Accepts variations like "D-2-2", "D2-2", "D_2_2", "d-2-2".
 * Returns null if the normalized value is not a valid visa type.
 */
export const parseVisaType = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .toUpperCase()
    .replace(/[\s\-]+/g, '_');

  // Handle cases like "D22" or "D41" (no separators at all)
  // by inserting underscores: D + digit + digit → D_digit_digit
  const withUnderscores = normalized.replace(
    /^(D)(\d)(\d)$/,
    '$1_$2_$3'
  );

  return VALID_VISA_TYPES.has(withUnderscores) ? withUnderscores : null;
};

/**
 * Parse enrollment status from Korean label or English enum value.
 * Returns null if not recognized.
 */
export const parseEnrollmentStatus = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Check Korean reverse lookup first
  const fromKorean = ENROLLMENT_STATUS_REVERSE[trimmed];
  if (fromKorean) return fromKorean;

  // Accept English enum values (case-insensitive)
  const upper = trimmed.toUpperCase();
  return VALID_ENROLLMENT.has(upper) ? upper : null;
};

/**
 * Parse program type from Korean label or English enum value.
 * Returns null if not recognized.
 */
export const parseProgramType = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Check Korean reverse lookup first
  const fromKorean = PROGRAM_TYPE_REVERSE[trimmed];
  if (fromKorean) return fromKorean;

  // Accept English enum values (case-insensitive)
  const upper = trimmed.toUpperCase();
  return VALID_PROGRAM.has(upper) ? upper : null;
};

/**
 * Parse insurance status from Korean label or English enum value.
 * Returns null if not recognized.
 */
export const parseInsuranceStatus = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Check Korean reverse lookup first
  const fromKorean = INSURANCE_STATUS_REVERSE[trimmed];
  if (fromKorean) return fromKorean;

  // Accept English enum values (case-insensitive)
  const upper = trimmed.toUpperCase();
  return VALID_INSURANCE.has(upper) ? upper : null;
};

/**
 * Parse date strings in various formats into ISO date strings (YYYY-MM-DD).
 *
 * Supported formats:
 * - YYYY-MM-DD, YYYY/MM/DD
 * - MM/DD/YYYY
 * - Excel serial dates (numeric, e.g. 45678)
 *
 * Excel serial date epoch is 1900-01-01 with the Lotus 1-2-3 off-by-one bug:
 * serial 1 = 1900-01-01, but day 60 is treated as 1900-02-29 (which doesn't exist).
 * To correct: subtract 2 from the serial and add to 1900-01-01.
 *
 * Returns null if the date is invalid or outside the 1900-2100 range.
 */
export const parseDate = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let year: number;
  let month: number;
  let day: number;

  // Excel serial date (pure number)
  if (/^\d+$/.test(trimmed)) {
    const serial = parseInt(trimmed, 10);
    if (serial < 1) return null;

    // Excel epoch: 1900-01-01 is serial 1
    // Off-by-one bug correction: subtract 2
    const excelEpoch = new Date(1900, 0, 1); // Jan 1, 1900
    const date = new Date(excelEpoch.getTime() + (serial - 2) * 86400000);

    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
  } else {
    // Try YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = trimmed.match(
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
    );
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    } else {
      // Try MM/DD/YYYY
      const usMatch = trimmed.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );
      if (usMatch) {
        month = parseInt(usMatch[1], 10);
        day = parseInt(usMatch[2], 10);
        year = parseInt(usMatch[3], 10);
      } else {
        return null;
      }
    }
  }

  // Validate year range
  if (year < 1900 || year > 2100) return null;

  // Validate month and day
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Construct a Date to verify validity (handles month length, leap years)
  const constructed = new Date(year, month - 1, day);
  if (
    constructed.getFullYear() !== year ||
    constructed.getMonth() !== month - 1 ||
    constructed.getDate() !== day
  ) {
    return null;
  }

  // Return ISO date string (YYYY-MM-DD)
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

/**
 * Parse a percentage value from a string.
 * Removes the % sign, parses as number, validates 0-100 range.
 * Returns null if invalid.
 */
export const parsePercentage = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/%/g, '').trim();
  const value = parseFloat(cleaned);

  if (isNaN(value)) return null;
  if (value < 0 || value > 100) return null;

  return value;
};

/**
 * Parse a GPA value from a string.
 * Validates 0.0-4.5 range (Korean university standard).
 * Returns null if invalid.
 */
export const parseGpa = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const value = parseFloat(trimmed);

  if (isNaN(value)) return null;
  if (value < 0 || value > 4.5) return null;

  return value;
};

/**
 * Basic email format validation.
 * Returns false for empty or malformed email strings.
 */
export const isValidEmail = (raw: string): boolean => {
  const trimmed = raw.trim();
  if (!trimmed) return false;

  // Simple email regex: local@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
};
