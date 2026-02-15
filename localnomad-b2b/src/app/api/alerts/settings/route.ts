import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRbac } from '@/lib/rbac';
import { getSettings, updateSettings } from '@/lib/notification-service';
import type { NotificationSettings } from '@/lib/notification-service';
import type { ApiResponse } from '@/types';

// GET /api/alerts/settings — Retrieve notification settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'read');
    if (rbacError) return rbacError;

    const user = session!.user;
    const settings = getSettings(user.universityId);

    return NextResponse.json({
      success: true,
      data: settings,
    } satisfies ApiResponse<NotificationSettings>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알림 설정 조회에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}

// PUT /api/alerts/settings — Update notification settings (ADMIN only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'create');
    if (rbacError) return rbacError;

    const user = session!.user;
    const body = (await request.json()) as Partial<NotificationSettings>;
    const updated = updateSettings(user.universityId, body);

    return NextResponse.json({
      success: true,
      data: updated,
    } satisfies ApiResponse<NotificationSettings>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알림 설정 변경에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
