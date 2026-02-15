import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

// PUT /api/alerts/read-all — Mark all unread alerts as read (scoped to university)
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'update');
    if (rbacError) return rbacError;

    const user = session!.user;

    const result = await prisma.alertLog.updateMany({
      where: {
        isRead: false,
        OR: [
          { student: { universityId: user.universityId, isDeleted: false } },
          { studentId: null, userId: user.id },
        ],
      },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
    } satisfies ApiResponse<{ updated: number }>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알림 일괄 읽음 처리에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
