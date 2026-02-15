import type { UserRole } from '@prisma/client';

// NextAuth User 인터페이스 확장 (콜백에서 as any 캐스팅 불필요)
declare module 'next-auth' {
  interface User {
    role: UserRole;
    universityId: string;
    universityName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      universityId: string;
      universityName: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    universityId: string;
    universityName: string;
  }
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// 트래픽 라이트 상태 타입
export type TrafficLightStatus = 'GREEN' | 'YELLOW' | 'RED';

// 트래픽 라이트 엔진 입력 타입
export interface TrafficLightInput {
  visaExpiry: Date | string;
  visaStatus: string;
  enrollmentStatus: string;
  attendanceRate: number | null;
  insuranceStatus: string;
  addressReported: boolean;
  partTimePermit: boolean;
  partTimePermitExpiry: Date | string | null;
  fimsReports?: {
    status: string;
    deadline: Date | string;
  }[];
}

// 트래픽 라이트 엔진 결과 타입
export interface TrafficLightResult {
  status: TrafficLightStatus;
  reasons: string[];
}

// 학생 + 트래픽 라이트 상태 포함 타입
export interface StudentWithStatus {
  id: string;
  nameKr: string | null;
  nameEn: string;
  nationality: string;
  visaType: string;
  visaExpiry: Date;
  visaStatus: string;
  enrollmentStatus: string;
  programType: string;
  department: string;
  attendanceRate: number | null;
  trafficLight: TrafficLightStatus;
}

// 학생 + 트래픽 라이트 상태 + 사유 포함 타입
export interface StudentWithTrafficLight extends StudentWithStatus {
  insuranceStatus: string;
  trafficLightReasons: string[];
}

// 타임라인 아이템 타입 (학생 상세 페이지)
export interface TimelineItem {
  id: string;
  type: 'STATUS_CHANGE' | 'FIMS_REPORT' | 'ALERT';
  date: string;
  title: string;
  description: string;
  metadata?: Record<string, string>;
}

// 학생 상세 API 응답 타입
export interface StudentDetailResponse {
  id: string;
  universityId: string;
  nameKr: string | null;
  nameEn: string;
  nationality: string;
  passportNumber: string | null;
  passportExpiry: string | null;
  arcNumber: string | null;
  visaType: string;
  visaExpiry: string;
  visaStatus: string;
  enrollmentStatus: string;
  programType: string;
  department: string;
  semester: string | null;
  attendanceRate: number | null;
  gpa: number | null;
  insuranceStatus: string;
  insuranceExpiry: string | null;
  address: string | null;
  addressReported: boolean;
  addressChangeDate: string | null;
  partTimePermit: boolean;
  partTimePermitExpiry: string | null;
  phone: string | null;
  email: string | null;
  kakaoId: string | null;
  emergencyContact: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  // Extended fields
  trafficLight: TrafficLightStatus;
  trafficLightReasons: string[];
  createdByName: string | null;
  canReadPii: boolean;
  timeline: TimelineItem[];
}

// 캘린더 관련 타입
export interface CalendarStudent {
  id: string;
  nameKr: string | null;
  nameEn: string;
  department: string;
  visaType: string;
  visaExpiry: string;
  visaStatus: string;
  trafficLight: TrafficLightStatus;
  daysRemaining: number;
}

export interface CalendarEvent {
  date: string;
  students: CalendarStudent[];
  count: number;
  urgency: TrafficLightStatus;
}

export interface FimsDeadline {
  date: string;
  type: 'PERIODIC';
  label: string;
}

export interface CalendarSummary {
  totalExpiring: number;
  within30Days: number;
  within60Days: number;
  within90Days: number;
}

export interface CalendarData {
  events: CalendarEvent[];
  fimsDeadlines: FimsDeadline[];
  summary: CalendarSummary;
}

// 임포트 관련 타입
export interface ParseResult {
  fileName: string;
  totalRows: number;
  headers: string[];
  preview: string[][];
  previewRowCount: number;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
  confidence: number;
  isManuallySet: boolean;
}

// 임포트 검증/실행 관련 타입
export interface ImportRowError {
  field: string;
  message: string;
}

export interface ImportDuplicateInfo {
  existingStudentId: string;
  existingNameEn: string;
  matchField: 'passportNumber' | 'arcNumber' | 'nameAndNationality';
}

export interface ImportValidatedRow {
  rowIndex: number;
  data: Record<string, string | number | boolean | null>;
  errors: ImportRowError[];
  duplicate?: ImportDuplicateInfo;
}

export interface ImportValidationResult {
  summary: { total: number; valid: number; errors: number; duplicates: number };
  validRows: ImportValidatedRow[];
  errorRows: ImportValidatedRow[];
  duplicateRows: ImportValidatedRow[];
}

export interface ImportExecuteRequest {
  fileName: string;
  validRows: ImportValidatedRow[];
  duplicateRows: ImportValidatedRow[];
  duplicateAction: 'skip' | 'overwrite' | 'manual';
}

export interface ImportExecutionResult {
  imported: number;
  skipped: number;
  updated: number;
  failed: number;
  errors: { rowIndex: number; error: string }[];
}

// 학생 폼 데이터 타입
export interface StudentFormData {
  nameEn: string;
  nameKr: string;
  nationality: string;
  visaType: string;
  visaExpiry: string;
  visaStatus: string;
  enrollmentStatus: string;
  programType: string;
  department: string;
  semester: string;
  attendanceRate: string;
  gpa: string;
  passportNumber: string;
  passportExpiry: string;
  arcNumber: string;
  insuranceStatus: string;
  insuranceExpiry: string;
  phone: string;
  email: string;
  kakaoId: string;
  emergencyContact: string;
  address: string;
  addressReported: boolean;
  addressChangeDate: string;
  partTimePermit: boolean;
  partTimePermitExpiry: string;
  notes: string;
}
