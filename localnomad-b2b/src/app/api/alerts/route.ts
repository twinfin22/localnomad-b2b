import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

// GET /api/alerts — Alert list with pagination and optional isRead filter
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'read');
    if (rbacError) return rbacError;
    // session is guaranteed non-null after withRbac passes
    const user = session!.user;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Parse optional isRead filter ("true" / "false" string)
    const isReadRaw = searchParams.get('isRead');
    const isReadParam: boolean | null =
      isReadRaw === 'true' ? true : isReadRaw === 'false' ? false : null;

    // Scope alerts to user's university (via student relation) or user-level alerts
    const where = {
      OR: [
        { student: { universityId: user.universityId, isDeleted: false } },
        { studentId: null, userId: user.id },
      ],
      ...(isReadParam !== null ? { isRead: isReadParam } : {}),
    };

    // Parallel fetch: alert list + total count
    const [alerts, total] = await Promise.all([
      prisma.alertLog.findMany({
        where,
        include: {
          student: {
            select: { nameKr: true, nameEn: true },
          },
        },
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.alertLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: alerts,
      meta: { total, page, limit },
    } satisfies ApiResponse<typeof alerts>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알림 목록 조회에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
