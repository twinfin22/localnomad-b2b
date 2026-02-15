import { differenceInDays } from 'date-fns';
import type { TrafficLightInput, TrafficLightResult } from '@/types';
import { ENROLLMENT_STATUS_LABELS, INSURANCE_STATUS_LABELS } from './constants';

// Pure traffic light calculation — no DB access
export const calculateTrafficLight = (
  input: TrafficLightInput,
  now: Date = new Date(),
): TrafficLightResult => {
  const redReasons: string[] = [];
  const yellowReasons: string[] = [];

  const visaExpiry = new Date(input.visaExpiry);
  const daysToExpiry = differenceInDays(visaExpiry, now);

  // === RED rules (any triggers RED) ===

  if (daysToExpiry <= 30 && daysToExpiry > 0) {
    redReasons.push(`비자 만료 ${daysToExpiry}일 전`);
  }

  if (daysToExpiry <= 0) {
    redReasons.push('비자가 만료되었습니다');
  }

  const criticalEnrollment = ['EXPELLED', 'WITHDRAWN', 'UNREGISTERED'];
  if (criticalEnrollment.includes(input.enrollmentStatus)) {
    const label = ENROLLMENT_STATUS_LABELS[input.enrollmentStatus] || input.enrollmentStatus;
    redReasons.push(`학적 상태: ${label}`);
  }

  if (input.visaStatus === 'EXPIRED') {
    redReasons.push('비자가 만료되었습니다');
  }

  if (input.attendanceRate !== null && input.attendanceRate < 50) {
    redReasons.push(`출석률 ${input.attendanceRate}% (50% 미만)`);
  }

  // FIMS report deadline <= 3 days
  if (input.fimsReports) {
    for (const report of input.fimsReports) {
      if (report.status === 'PENDING' || report.status === 'READY') {
        const deadline = new Date(report.deadline);
        const daysToDeadline = differenceInDays(deadline, now);
        if (daysToDeadline <= 3 && daysToDeadline >= 0) {
          redReasons.push(`FIMS 변동신고 기한 ${daysToDeadline}일 이내`);
        }
      }
    }
  }

  // === YELLOW rules (only if not already RED for that reason) ===

  if (daysToExpiry > 30 && daysToExpiry <= 60) {
    yellowReasons.push(`비자 만료 ${daysToExpiry}일 전`);
  }

  if (input.enrollmentStatus === 'ON_LEAVE') {
    yellowReasons.push('휴학 중');
  }

  const warningInsurance = ['EXPIRING', 'EXPIRED'];
  if (warningInsurance.includes(input.insuranceStatus)) {
    const label = INSURANCE_STATUS_LABELS[input.insuranceStatus] || input.insuranceStatus;
    yellowReasons.push(`건강보험 ${label}`);
  }

  if (input.attendanceRate !== null && input.attendanceRate >= 50 && input.attendanceRate < 70) {
    yellowReasons.push(`출석률 ${input.attendanceRate}% (70% 미만)`);
  }

  if (!input.addressReported) {
    yellowReasons.push('체류지 변경 미신고');
  }

  if (input.partTimePermit && input.partTimePermitExpiry) {
    const permitExpiry = new Date(input.partTimePermitExpiry);
    const daysToPermitExpiry = differenceInDays(permitExpiry, now);
    if (daysToPermitExpiry <= 30 && daysToPermitExpiry > 0) {
      yellowReasons.push('시간제취업 허가 만료 임박');
    }
  }

  // Pending FIMS report (deadline > 3 days)
  if (input.fimsReports) {
    for (const report of input.fimsReports) {
      if (report.status === 'PENDING' || report.status === 'READY') {
        const deadline = new Date(report.deadline);
        const daysToDeadline = differenceInDays(deadline, now);
        if (daysToDeadline > 3) {
          yellowReasons.push('FIMS 변동신고 대기 중');
          break; // only add once
        }
      }
    }
  }

  // === Determine final status ===

  if (redReasons.length > 0) {
    return { status: 'RED', reasons: redReasons };
  }

  if (yellowReasons.length > 0) {
    return { status: 'YELLOW', reasons: yellowReasons };
  }

  return { status: 'GREEN', reasons: ['정상'] };
};

// Batch computation for a list of students
export const calculateTrafficLightBatch = <
  T extends TrafficLightInput & { id: string },
>(
  students: T[],
  now: Date = new Date(),
): Map<string, TrafficLightResult> => {
  const results = new Map<string, TrafficLightResult>();
  for (const student of students) {
    results.set(student.id, calculateTrafficLight(student, now));
  }
  return results;
};
