import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

interface DashboardSummary {
  totalStudents: number;
  byVisaStatus: Record<string, number>;
  byEnrollmentStatus: Record<string, number>;
  overstayRate: number;
  pendingFimsReports: number;
  unreadAlerts: number;
  upcomingVisaExpiries: Array<{ count: number; period: string }>;
}

// Enhanced dashboard summary with grouped statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const universityId = session.user.universityId;
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for performance
    const [
      totalStudents,
      visaStatusGroups,
      enrollmentStatusGroups,
      university,
      pendingFimsReports,
      unreadAlerts,
      expiring30,
      expiring60,
      expiring90,
    ] = await Promise.all([
      // Total active students
      prisma.student.count({
        where: { universityId, isDeleted: false },
      }),
      // Group by visa status
      prisma.student.groupBy({
        by: ['visaStatus'],
        where: { universityId, isDeleted: false },
        _count: true,
      }),
      // Group by enrollment status
      prisma.student.groupBy({
        by: ['enrollmentStatus'],
        where: { universityId, isDeleted: false },
        _count: true,
      }),
      // University overstay rate
      prisma.university.findUnique({
        where: { id: universityId },
        select: { overstayRate: true },
      }),
      // Pending FIMS reports
      prisma.fimsReport.count({
        where: {
          student: { universityId },
          status: { in: ['PENDING', 'READY'] },
        },
      }),
      // Unread alerts for the current user
      prisma.alertLog.count({
        where: { userId: session.user.id, isRead: false },
      }),
      // Visa expiring within 30 days
      prisma.student.count({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: { gte: now, lte: thirtyDays },
        },
      }),
      // Visa expiring within 31-60 days
      prisma.student.count({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: { gt: thirtyDays, lte: sixtyDays },
        },
      }),
      // Visa expiring within 61-90 days
      prisma.student.count({
        where: {
          universityId,
          isDeleted: false,
          visaExpiry: { gt: sixtyDays, lte: ninetyDays },
        },
      }),
    ]);

    // Transform groupBy results to Record<string, number>
    const byVisaStatus: Record<string, number> = {};
    for (const group of visaStatusGroups) {
      byVisaStatus[group.visaStatus] = group._count;
    }

    const byEnrollmentStatus: Record<string, number> = {};
    for (const group of enrollmentStatusGroups) {
      byEnrollmentStatus[group.enrollmentStatus] = group._count;
    }

    const summary: DashboardSummary = {
      totalStudents,
      byVisaStatus,
      byEnrollmentStatus,
      overstayRate: university?.overstayRate ? Number(university.overstayRate) : 0,
      pendingFimsReports,
      unreadAlerts,
      upcomingVisaExpiries: [
        { count: expiring30, period: '30일 이내' },
        { count: expiring60, period: '31~60일' },
        { count: expiring90, period: '61~90일' },
      ],
    };

    return NextResponse.json({
      success: true,
      data: summary,
    } satisfies ApiResponse<DashboardSummary>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '대시보드 데이터를 가져올 수 없습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
