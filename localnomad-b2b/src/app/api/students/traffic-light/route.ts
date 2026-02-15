import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import { calculateTrafficLightBatch } from '@/lib/traffic-light';
import type { TrafficLightStatus } from '@/types';

// Sort priority: RED first, then YELLOW, then GREEN
const TL_SORT_PRIORITY: Record<TrafficLightStatus, number> = {
  RED: 0,
  YELLOW: 1,
  GREEN: 2,
};

// GET /api/students/traffic-light — Traffic Light summary with sorted student list
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'read');
    if (rbacError) return rbacError;
    const user = session!.user;

    // Fetch all non-deleted students for this university, with pending/ready FIMS reports
    const students = await prisma.student.findMany({
      where: {
        universityId: user.universityId,
        isDeleted: false,
      },
      omit: { passportNumber: true, arcNumber: true },
      include: {
        fimsReports: {
          where: { status: { in: ['PENDING', 'READY'] } },
          select: { status: true, deadline: true },
        },
      },
    });

    // Prepare input for batch TL calculation
    const tlInputs = students.map((s) => ({
      id: s.id,
      visaExpiry: s.visaExpiry,
      visaStatus: s.visaStatus,
      enrollmentStatus: s.enrollmentStatus,
      attendanceRate: s.attendanceRate !== null ? Number(s.attendanceRate) : null,
      insuranceStatus: s.insuranceStatus,
      addressReported: s.addressReported,
      partTimePermit: s.partTimePermit,
      partTimePermitExpiry: s.partTimePermitExpiry,
      fimsReports: s.fimsReports,
    }));

    const tlResults = calculateTrafficLightBatch(tlInputs);

    // Build summary counts
    const summary = { GREEN: 0, YELLOW: 0, RED: 0, total: students.length };
    for (const result of tlResults.values()) {
      summary[result.status]++;
    }

    // Build student list with TL info, sorted by RED -> YELLOW -> GREEN, then visaExpiry ASC
    const studentsWithTl = students.map((s) => {
      const tl = tlResults.get(s.id)!;
      return {
        id: s.id,
        nameKr: s.nameKr,
        nameEn: s.nameEn,
        nationality: s.nationality,
        department: s.department,
        visaType: s.visaType,
        visaExpiry: s.visaExpiry,
        visaStatus: s.visaStatus,
        enrollmentStatus: s.enrollmentStatus,
        insuranceStatus: s.insuranceStatus,
        attendanceRate: s.attendanceRate !== null ? Number(s.attendanceRate) : null,
        trafficLight: tl.status,
        trafficLightReasons: tl.reasons,
      };
    });

    studentsWithTl.sort((a, b) => {
      const priorityDiff = TL_SORT_PRIORITY[a.trafficLight] - TL_SORT_PRIORITY[b.trafficLight];
      if (priorityDiff !== 0) return priorityDiff;
      // Within same TL status, sort by visaExpiry ascending (earliest first)
      return new Date(a.visaExpiry).getTime() - new Date(b.visaExpiry).getTime();
    });

    return NextResponse.json({
      success: true,
      data: { summary, students: studentsWithTl },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '트래픽 라이트 조회에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
