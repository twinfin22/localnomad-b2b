import type { ColumnMapping } from '@/types';

// System field labels in Korean for UI display
export const SYSTEM_FIELD_LABELS: Record<string, string> = {
  nameKr: '한글 이름',
  nameEn: '영문 이름',
  nationality: '국적',
  passportNumber: '여권번호',
  visaType: '비자 유형',
  visaExpiry: '비자 만료일',
  enrollmentStatus: '학적 상태',
  department: '학과',
  attendanceRate: '출석률',
  phone: '연락처',
  email: '이메일',
  address: '주소',
  gpa: '학점',
  studentId: '학번',
  arcNumber: '외국인등록번호',
  insuranceStatus: '보험 상태',
  programType: '과정 유형',
  semester: '학기',
  passportExpiry: '여권 만료일',
};

export const AVAILABLE_TARGET_FIELDS = Object.keys(SYSTEM_FIELD_LABELS);

// Pattern dictionary: each system field maps to multiple possible header names
const FIELD_PATTERNS: Record<string, string[]> = {
  nameKr: ['이름', '성명', '학생명', '한글이름', '한글성명'],
  nameEn: ['영문이름', 'english name', 'name', '영문성명', '영문명'],
  nationality: ['국적', 'nationality', '국가', 'country'],
  passportNumber: ['여권번호', 'passport no', 'passport', 'passport number'],
  visaType: ['비자종류', '체류자격', 'visa type', '체류자격코드', '비자유형'],
  visaExpiry: [
    '만료일',
    '체류기한',
    '비자만료',
    'visa expiry',
    'd-2만료일',
    '체류만료일',
    'd-2 만료일',
  ],
  enrollmentStatus: ['학적상태', '재학여부', 'status', '학적', '재학상태'],
  department: ['학과', '소속학과', 'department', '전공', '학부'],
  attendanceRate: ['출석률', '출석', 'attendance', '수강현황'],
  phone: ['연락처', '전화번호', 'phone', '핸드폰', '휴대폰', 'mobile'],
  email: ['이메일', 'email', 'e-mail', '메일'],
  address: ['주소', '거주지', '체류지', 'address', '주소지'],
  gpa: ['학점', '성적', 'gpa', '평균학점', '평점'],
  studentId: ['학번', 'student id', '학생번호'],
  arcNumber: ['외국인등록번호', 'arc', 'arc number', '등록번호'],
  insuranceStatus: ['보험', '보험상태', 'insurance', '건강보험'],
  programType: ['과정', '학위과정', 'program', 'program type', '과정유형', '학위'],
  semester: ['학기', 'semester', '현재학기'],
  passportExpiry: ['여권만료', '여권만료일', 'passport expiry', 'passport exp'],
};

// Normalize a string for comparison
const normalize = (str: string): string =>
  str
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\.]+/g, ' ');

// Calculate longest common substring length between two strings
const longestCommonSubstringLength = (a: string, b: string): number => {
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  let maxLen = 0;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
        if (matrix[i][j] > maxLen) {
          maxLen = matrix[i][j];
        }
      }
    }
  }

  return maxLen;
};

// Match a single header against all patterns for a single field
const matchHeaderToField = (
  normalizedHeader: string,
  patterns: string[]
): number => {
  for (const pattern of patterns) {
    const normalizedPattern = normalize(pattern);

    // Exact match
    if (normalizedHeader === normalizedPattern) {
      return 100;
    }
  }

  for (const pattern of patterns) {
    const normalizedPattern = normalize(pattern);

    // Contains match (header contains pattern OR pattern contains header)
    if (
      normalizedHeader.includes(normalizedPattern) ||
      normalizedPattern.includes(normalizedHeader)
    ) {
      return 90;
    }
  }

  // Fuzzy match: longest common substring
  let bestFuzzyConfidence = 0;
  for (const pattern of patterns) {
    const normalizedPattern = normalize(pattern);
    const lcsLength = longestCommonSubstringLength(
      normalizedHeader,
      normalizedPattern
    );
    const shorterLen = Math.min(normalizedHeader.length, normalizedPattern.length);

    if (shorterLen > 0 && lcsLength / shorterLen >= 0.6) {
      bestFuzzyConfidence = Math.max(bestFuzzyConfidence, 75);
    }
  }

  return bestFuzzyConfidence;
};

// Auto-map uploaded file headers to system fields
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  const usedTargets = new Set<string>();

  // Build all candidate matches: { headerIndex, targetField, confidence }
  interface Candidate {
    headerIndex: number;
    targetField: string;
    confidence: number;
  }

  const candidates: Candidate[] = [];

  for (let i = 0; i < headers.length; i++) {
    const normalizedHeader = normalize(headers[i]);
    if (!normalizedHeader) continue;

    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      const confidence = matchHeaderToField(normalizedHeader, patterns);
      if (confidence > 0) {
        candidates.push({
          headerIndex: i,
          targetField: field,
          confidence,
        });
      }
    }
  }

  // Sort by confidence descending so higher-confidence mappings get priority
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Track which headers have been assigned
  const headerMappings = new Map<number, { targetField: string; confidence: number }>();

  for (const candidate of candidates) {
    // Skip if target field already used or header already mapped
    if (usedTargets.has(candidate.targetField)) continue;
    if (headerMappings.has(candidate.headerIndex)) continue;

    headerMappings.set(candidate.headerIndex, {
      targetField: candidate.targetField,
      confidence: candidate.confidence,
    });
    usedTargets.add(candidate.targetField);
  }

  // Build final mapping array preserving header order
  return headers.map((header, index): ColumnMapping => {
    const mapping = headerMappings.get(index);
    return {
      sourceColumn: header,
      targetField: mapping?.targetField ?? null,
      confidence: mapping?.confidence ?? 0,
      isManuallySet: false,
    };
  });
};

// Get human-readable confidence level
export const getConfidenceLevel = (
  confidence: number
): 'high' | 'medium' | 'low' => {
  if (confidence >= 95) return 'high';
  if (confidence >= 80) return 'medium';
  return 'low';
};
