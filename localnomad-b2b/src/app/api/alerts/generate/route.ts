import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRbac } from '@/lib/rbac';
import { generateAlerts } from '@/lib/alert-engine';
import { createAuditLog } from '@/lib/audit';
import type { ApiResponse } from '@/types';

// POST /api/alerts/generate — Trigger alert generation (ADMIN only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'alert', 'create');
    if (rbacError) return rbacError;

    const user = session!.user;

    const { generated, skipped } = await generateAlerts(user.universityId, user.id);

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      resource: 'ALERT',
      details: { generated, skipped },
    });

    return NextResponse.json({
      success: true,
      data: { generated, skipped },
    } satisfies ApiResponse<{ generated: number; skipped: number }>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '알림 생성에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
