import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';

interface DashboardSummary {
  totalStudents: number;
  expiringVisas: number;
  overstayRate: number;
  unreadAlerts: number;
}

// 대시보드 요약 데이터 조회
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

    // 병렬 쿼리로 성능 최적화
    const [totalStudents, expiringVisas, university, unreadAlerts] = await Promise.all([
      prisma.student.count({
        where: { universityId, isDeleted: false },
      }),
      prisma.student.count({
        where: { universityId, isDeleted: false, visaStatus: 'EXPIRING_SOON' },
      }),
      prisma.university.findUnique({
        where: { id: universityId },
        select: { overstayRate: true },
      }),
      prisma.alertLog.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    const summary: DashboardSummary = {
      totalStudents,
      expiringVisas,
      overstayRate: university?.overstayRate ? Number(university.overstayRate) : 0,
      unreadAlerts,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    } satisfies ApiResponse<DashboardSummary>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '대시보드 데이터를 가져올 수 없습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
