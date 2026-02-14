import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 날짜를 한국식 형식으로 변환 (YYYY.MM.DD)
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// D-day 계산 (만료일까지 남은 일수)
export function getDaysUntil(targetDate: Date | string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 트래픽 라이트 상태 결정
export function getTrafficLight(
  visaExpiryDays: number,
  enrollmentStatus: string,
  attendanceRate?: number | null,
): 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' {
  // RED: 불법체류 위험 (만료, 제적, 미등록)
  if (visaExpiryDays <= 0) return 'RED';
  if (['EXPELLED', 'UNREGISTERED'].includes(enrollmentStatus)) return 'RED';

  // ORANGE: 경고 (만료 30일 이내, 출석률 70% 미만)
  if (visaExpiryDays <= 30) return 'ORANGE';
  if (attendanceRate !== null && attendanceRate !== undefined && attendanceRate < 70) return 'ORANGE';

  // YELLOW: 주의 (만료 60일 이내, 휴학)
  if (visaExpiryDays <= 60) return 'YELLOW';
  if (enrollmentStatus === 'ON_LEAVE') return 'YELLOW';

  // GREEN: 정상
  return 'GREEN';
}
