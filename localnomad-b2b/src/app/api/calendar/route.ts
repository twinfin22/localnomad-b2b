import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import { calculateTrafficLight } from '@/lib/traffic-light';
import {
  differenceInDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
} from 'date-fns';
import type {
  ApiResponse,
  CalendarData,
  CalendarEvent,
  CalendarStudent,
  FimsDeadline,
  TrafficLightStatus,
} from '@/types';

// FIMS quarterly deadlines (month is 0-indexed for Date constructor)
const FIMS_QUARTERLY_DEADLINES: Array<{ month: number; day: number; label: string }> = [
  { month: 1, day: 28, label: '2월 정기보고 마감' },
  { month: 4, day: 31, label: '5월 정기보고 마감' },
  { month: 7, day: 31, label: '8월 정기보고 마감' },
  { month: 10, day: 30, label: '11월 정기보고 마감' },
];

// Traffic light severity for urgency comparison (higher = worse)
const TL_SEVERITY: Record<TrafficLightStatus, number> = {
  GREEN: 0,
  YELLOW: 1,
  RED: 2,
};

// Non-PII fields to select from the Student model
const STUDENT_SELECT = {
  id: true,
  nameKr: true,
  nameEn: true,
  department: true,
  visaType: true,
  visaExpiry: true,
  visaStatus: true,
  enrollmentStatus: true,
  attendanceRate: true,
  insuranceStatus: true,
  addressReported: true,
  partTimePermit: true,
  partTimePermitExpiry: true,
} as const;

/**
 * Calculate the date range based on the requested view.
 */
const calculateDateRange = (
  year: number,
  month: number,
  view: string,
  week: number | null,
  filter: string,
): { rangeStart: Date; rangeEnd: Date } => {
  if (view === 'week') {
    // ISO week calculation: Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    const weekStart = startOfWeek(addDays(jan4, ((week ?? 1) - 1) * 7), {
      weekStartsOn: 1,
    });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return { rangeStart: weekStart, rangeEnd: weekEnd };
  }

  if (view === 'list') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysMap: Record<string, number> = {
      '30': 30,
      '60': 60,
      '90': 90,
      all: 365,
    };
    const days = daysMap[filter] ?? 365;
    return { rangeStart: today, rangeEnd: addDays(today, days) };
  }

  // Default: month view
  const targetDate = new Date(year, month - 1);
  return {
    rangeStart: startOfMonth(targetDate),
    rangeEnd: endOfMonth(targetDate),
  };
};

/**
 * Generate FIMS deadlines for a given year, filtered to the date range.
 */
const generateFimsDeadlines = (
  year: number,
  rangeStart: Date,
  rangeEnd: Date,
): FimsDeadline[] => {
  const deadlines: FimsDeadline[] = [];

  for (const { month, day, label } of FIMS_QUARTERLY_DEADLINES) {
    const deadlineDate = new Date(year, month, day);
    if (deadlineDate >= rangeStart && deadlineDate <= rangeEnd) {
      deadlines.push({
        date: format(deadlineDate, 'yyyy-MM-dd'),
        type: 'PERIODIC',
        label,
      });
    }
  }

  return deadlines;
};

/**
 * Determine the worst (highest severity) traffic light status.
 */
const worstUrgency = (statuses: TrafficLightStatus[]): TrafficLightStatus => {
  let worst: TrafficLightStatus = 'GREEN';
  for (const s of statuses) {
    if (TL_SEVERITY[s] > TL_SEVERITY[worst]) {
      worst = s;
    }
  }
  return worst;
};

// GET /api/calendar — Visa expiry calendar data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'read');
    if (rbacError) return rbacError;

    const universityId = session!.user.universityId;
    const { searchParams } = new URL(request.url);

    // Parse and validate required params
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam || !monthParam) {
      return NextResponse.json(
        {
          success: false,
          error: '연도(year)와 월(month)은 필수 파라미터입니다.',
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        {
          success: false,
          error: '연도(year)와 월(month)의 값이 올바르지 않습니다.',
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const view = searchParams.get('view') || 'month';
    const weekParam = searchParams.get('week');
    const week = weekParam ? parseInt(weekParam, 10) : null;
    const filter = searchParams.get('filter') || 'all';

    // Validate week param when view=week
    if (view === 'week' && (week === null || isNaN(week) || week < 1 || week > 53)) {
      return NextResponse.json(
        {
          success: false,
          error: '주간 보기(view=week)에는 유효한 주 번호(week)가 필요합니다.',
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    // Calculate date range for the view
    const { rangeStart, rangeEnd } = calculateDateRange(year, month, view, week, filter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query students with visa expiry within the date range (non-PII only)
    // and summary counts in parallel
    const [students, within30, within60, within90] = await Promise.all([
      prisma.student.findMany({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        select: STUDENT_SELECT,
      }),
      // Summary counts: students with visa expiry within 30/60/90 days from today
      prisma.student.count({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: {
            gte: today,
            lte: addDays(today, 30),
          },
        },
      }),
      prisma.student.count({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: {
            gte: today,
            lte: addDays(today, 60),
          },
        },
      }),
      prisma.student.count({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: {
            gte: today,
            lte: addDays(today, 90),
          },
        },
      }),
    ]);

    // Compute traffic light and daysRemaining for each student, grouped by date
    const dateGroupMap = new Map<string, CalendarStudent[]>();

    for (const student of students) {
      const tl = calculateTrafficLight({
        visaExpiry: student.visaExpiry,
        visaStatus: student.visaStatus,
        enrollmentStatus: student.enrollmentStatus,
        attendanceRate:
          student.attendanceRate !== null ? Number(student.attendanceRate) : null,
        insuranceStatus: student.insuranceStatus,
        addressReported: student.addressReported,
        partTimePermit: student.partTimePermit,
        partTimePermitExpiry: student.partTimePermitExpiry,
      });

      const daysRemaining = differenceInDays(new Date(student.visaExpiry), today);
      const dateKey = format(new Date(student.visaExpiry), 'yyyy-MM-dd');

      const calendarStudent: CalendarStudent = {
        id: student.id,
        nameKr: student.nameKr,
        nameEn: student.nameEn,
        department: student.department,
        visaType: student.visaType,
        visaExpiry: dateKey,
        visaStatus: student.visaStatus,
        trafficLight: tl.status,
        daysRemaining,
      };

      const existing = dateGroupMap.get(dateKey);
      if (existing) {
        existing.push(calendarStudent);
      } else {
        dateGroupMap.set(dateKey, [calendarStudent]);
      }
    }

    // Build events sorted by date ascending
    const events: CalendarEvent[] = Array.from(dateGroupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, groupStudents]) => ({
        date,
        students: groupStudents,
        count: groupStudents.length,
        urgency: worstUrgency(groupStudents.map((s) => s.trafficLight)),
      }));

    // Generate FIMS deadlines for the requested year, filtered to range
    const fimsDeadlines = generateFimsDeadlines(year, rangeStart, rangeEnd);

    const data: CalendarData = {
      events,
      fimsDeadlines,
      summary: {
        totalExpiring: within90,
        within30Days: within30,
        within60Days: within60,
        within90Days: within90,
      },
    };

    return NextResponse.json({
      success: true,
      data,
    } satisfies ApiResponse<CalendarData>);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : '캘린더 데이터를 가져올 수 없습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
