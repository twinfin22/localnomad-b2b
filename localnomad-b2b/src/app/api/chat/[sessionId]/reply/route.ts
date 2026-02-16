import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

interface ReplyRequest {
  message: string;
  resolveEscalation?: boolean;
}

// POST /api/chat/:sessionId/reply — Staff replies to a chat session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    // Auth + RBAC: only ADMIN and MANAGER can reply
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'chat', 'reply');
    if (rbacError) return rbacError;

    const { sessionId } = await params;
    const body = (await request.json()) as ReplyRequest;
    const { message, resolveEscalation } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '답변 내용을 입력해 주세요.' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    // Verify session exists
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 },
      );
    }

    // Create staff message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'staff',
        content: message,
        language: chatSession.language,
      },
    });

    // Optionally resolve escalation
    if (resolveEscalation && chatSession.isEscalated) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { resolvedAt: new Date() },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          messageId: chatMessage.id,
          sessionId,
          resolved: resolveEscalation ?? false,
        },
      } satisfies ApiResponse<{ messageId: string; sessionId: string; resolved: boolean }>,
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : '답변 등록에 실패했습니다.';
    console.error('[Chat Reply] Error:', errMessage);
    return NextResponse.json(
      { success: false, error: '답변 등록에 실패했습니다.' } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
