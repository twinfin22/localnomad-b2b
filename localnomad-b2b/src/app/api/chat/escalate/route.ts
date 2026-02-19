import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

interface EscalateRequest {
  sessionId: string;
  reason?: string;
  urgent?: boolean;
}

// POST /api/chat/escalate — Create an escalation alert from a chat session
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    const rbacError = withRbac(authSession, 'chat', 'escalate');
    if (rbacError) return rbacError;
    const user = authSession!.user;

    const body = (await request.json()) as EscalateRequest;
    const { sessionId, reason, urgent } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    // Verify session exists
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { role: true, content: true, createdAt: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    // Build alert message from recent messages
    const recentContext = session.messages
      .reverse()
      .map((m) => `[${m.role}] ${m.content.slice(0, 100)}`)
      .join('\n');

    const urgencyLabel = urgent ? '긴급' : '일반';
    const alertTitle = `AI 상담 에스컬레이션 (${urgencyLabel})`;
    const alertMessage = reason
      ? `${reason}\n\n--- 최근 대화 ---\n${recentContext}`
      : `AI 상담에서 담당자 연결이 요청되었습니다.\n\n--- 최근 대화 ---\n${recentContext}`;

    // Create AlertLog for CHAT_ESCALATION (with userId for visibility in alerts list)
    const alertData = {
      type: 'CHAT_ESCALATION' as const,
      title: alertTitle,
      message: alertMessage,
      userId: user.id,
    };

    const [alert] = await Promise.all([
      prisma.alertLog.create({
        data: { ...alertData, channel: 'IN_APP' as const },
      }),
      ...(urgent
        ? [prisma.alertLog.create({ data: { ...alertData, channel: 'EMAIL' as const } })]
        : []),
      prisma.chatSession.update({
        where: { id: sessionId },
        data: { isEscalated: true, escalatedAt: new Date() },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          alertId: alert.id,
          sessionId,
          urgent: urgent ?? false,
        },
      } satisfies ApiResponse<{ alertId: string; sessionId: string; urgent: boolean }>,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '에스컬레이션 처리 중 오류가 발생했습니다.';
    console.error('[Chat Escalate] Error:', message);
    return NextResponse.json(
      { success: false, error: '에스컬레이션 처리 중 오류가 발생했습니다.' } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
