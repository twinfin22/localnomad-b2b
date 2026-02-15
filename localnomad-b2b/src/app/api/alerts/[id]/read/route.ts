import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

// PUT /api/alerts/[id]/read — Mark a single alert as read
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'update');
    if (rbacError) return rbacError;

    const user = session!.user;

    // Fetch alert and verify it belongs to user's university
    const alert = await prisma.alertLog.findUnique({
      where: { id },
      include: {
        student: { select: { universityId: true, isDeleted: true } },
      },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: '알림을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    // Authorization: alert must belong to user's university (via student) or be a user-level alert
    const belongsToUniversity =
      (alert.student && alert.student.universityId === user.universityId && !alert.student.isDeleted) ||
      (alert.studentId === null && alert.userId === user.id);

    if (!belongsToUniversity) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' } satisfies ApiResponse<never>,
        { status: 403 },
      );
    }

    const updated = await prisma.alertLog.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    } satisfies ApiResponse<typeof updated>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
