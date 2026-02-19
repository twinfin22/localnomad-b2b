import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import type { ApiResponse } from '@/types';

interface ChatMessageData {
  id: string;
  role: string;
  content: string;
  intent: string | null;
  language: string | null;
  isEscalated: boolean;
  sources: unknown;
  createdAt: Date;
}

// GET /api/chat/:sessionId — Get chat history for a session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const authSession = await getServerSession(authOptions);
    const rbacError = withRbac(authSession, 'chat', 'read');
    if (rbacError) return rbacError;

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' } satisfies ApiResponse<never>,
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

    // Fetch messages with pagination
    const url = new URL(_request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10)));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          role: true,
          content: true,
          intent: true,
          language: true,
          isEscalated: true,
          sources: true,
          createdAt: true,
        },
      }),
      prisma.chatMessage.count({ where: { sessionId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        language: chatSession.language,
        isEscalated: chatSession.isEscalated,
        messages: messages as ChatMessageData[],
      },
      meta: { total, page, limit },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '채팅 내역 조회에 실패했습니다.';
    console.error('[Chat History] Error:', message);
    return NextResponse.json(
      { success: false, error: '채팅 내역 조회에 실패했습니다.' } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
