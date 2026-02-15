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
