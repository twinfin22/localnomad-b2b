import { differenceInDays } from 'date-fns';
import { prisma } from '@/lib/prisma';
import type { AlertType } from '@prisma/client';

// Alert rule result returned by individual rule evaluators
interface AlertRuleResult {
  type: AlertType;
  title: string;
  message: string;
}

// Student shape returned by the query (with included fimsReports)
interface StudentForAlert {
  id: string;
  nameKr: string | null;
  nameEn: string;
  visaExpiry: Date;
  attendanceRate: { toNumber: () => number } | null;
  insuranceStatus: string;
  fimsReports: {
    status: string;
    deadline: Date;
  }[];
}

// Resolve display name: prefer Korean name, fall back to English
const displayName = (s: StudentForAlert): string => s.nameKr || s.nameEn;

// --- Rule evaluators ---

const evaluateVisaExpiry = (student: StudentForAlert): AlertRuleResult | null => {
  const daysLeft = differenceInDays(student.visaExpiry, new Date());
  if (daysLeft <= 30) {
    return {
      type: 'VISA_EXPIRY',
      title: '비자 만료 긴급',
      message: `${displayName(student)}님의 비자 만료까지 ${daysLeft}일 남았습니다.`,
    };
  }
  if (daysLeft <= 60) {
    return {
      type: 'VISA_EXPIRY',
      title: '비자 만료 임박',
      message: `${displayName(student)}님의 비자 만료까지 ${daysLeft}일 남았습니다. 연장 신청을 안내해 주세요.`,
    };
  }
  return null;
};

const evaluateAttendanceLow = (student: StudentForAlert): AlertRuleResult | null => {
  if (student.attendanceRate === null) return null;
  const rate = student.attendanceRate.toNumber();
  if (rate < 70) {
    return {
      type: 'ATTENDANCE_LOW',
      title: '출석률 저조 경고',
      message: `${displayName(student)}님의 출석률이 ${rate}%입니다. 학사 관리가 필요합니다.`,
    };
  }
  return null;
};

const evaluateFimsDeadline = (student: StudentForAlert): AlertRuleResult | null => {
  const now = new Date();
  for (const report of student.fimsReports) {
    if (report.status === 'PENDING' || report.status === 'READY') {
      const daysLeft = differenceInDays(report.deadline, now);
      if (daysLeft <= 7) {
        return {
          type: 'FIMS_DEADLINE',
          title: 'FIMS 변동신고 기한 임박',
          message: `${displayName(student)}님의 FIMS 변동신고 기한까지 ${daysLeft}일 남았습니다.`,
        };
      }
    }
  }
  return null;
};

const evaluateInsuranceExpiry = (student: StudentForAlert): AlertRuleResult | null => {
  if (student.insuranceStatus === 'EXPIRING' || student.insuranceStatus === 'EXPIRED') {
    return {
      type: 'INSURANCE_EXPIRY',
      title: '건강보험 만료 알림',
      message: `${displayName(student)}님의 건강보험이 만료되었거나 만료 예정입니다.`,
    };
  }
  return null;
};

const RULES = [evaluateVisaExpiry, evaluateAttendanceLow, evaluateFimsDeadline, evaluateInsuranceExpiry];

// Check whether a duplicate alert already exists within the last 7 days
const isDuplicate = async (studentId: string, type: AlertType): Promise<boolean> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const existing = await prisma.alertLog.findFirst({
    where: {
      studentId,
      type,
      sentAt: { gte: sevenDaysAgo },
    },
  });
  return existing !== null;
};

/**
 * Generate alerts for all non-deleted students in a university.
 * Evaluates all rules, deduplicates against recent alerts, and creates AlertLog records.
 */
export const generateAlerts = async (
  universityId: string,
  userId: string,
): Promise<{ generated: number; skipped: number }> => {
  // Fetch all active students with pending/ready FIMS reports
  const students = await prisma.student.findMany({
    where: { universityId, isDeleted: false },
    include: {
      fimsReports: {
        where: { status: { in: ['PENDING', 'READY'] } },
        select: { status: true, deadline: true },
      },
    },
  });

  let generated = 0;
  let skipped = 0;

  for (const student of students) {
    for (const rule of RULES) {
      const result = rule(student as unknown as StudentForAlert);
      if (!result) continue;

      const duplicate = await isDuplicate(student.id, result.type);
      if (duplicate) {
        skipped++;
        continue;
      }

      await prisma.alertLog.create({
        data: {
          studentId: student.id,
          userId,
          type: result.type,
          channel: 'IN_APP',
          title: result.title,
          message: result.message,
        },
      });
      generated++;
    }
  }

  return { generated, skipped };
};
