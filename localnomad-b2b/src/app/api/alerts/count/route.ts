import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

// GET /api/alerts/count — Get unread alert count (scoped to university)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'read');
    if (rbacError) return rbacError;

    const user = session!.user;

    const unreadCount = await prisma.alertLog.count({
      where: {
        isRead: false,
        OR: [
          { student: { universityId: user.universityId, isDeleted: false } },
          { studentId: null, userId: user.id },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: { unreadCount },
    } satisfies ApiResponse<{ unreadCount: number }>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '읽지 않은 알림 수 조회에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
