import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskPii, unmaskPii } from '@/lib/pii-masker';
import { classifyUserIntent } from '@/lib/chatbot/intent-classifier';
import { checkSafety } from '@/lib/chatbot/safety-filter';
import { searchFAQByIntent, getFAQAnswer } from '@/lib/chatbot/knowledge-base';
import { generateResponse, getCannedResponse } from '@/lib/chatbot/claude-client';
import type { ChatLanguage } from '@/lib/chatbot/knowledge-base';
import type { ApiResponse } from '@/types';

// In-memory rate limiter: sessionId → { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const checkRateLimit = (sessionId: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
};

interface ChatRequest {
  message: string;
  sessionId?: string;
  language?: string;
}

interface ChatResponse {
  sessionId: string;
  message: string;
  intent: string;
  confidence: number;
  language: string;
  isEscalated: boolean;
  sources: string[];
}

// POST /api/chat — Main chat endpoint
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { message, language } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '메시지를 입력해 주세요.' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: '메시지는 2000자 이내로 입력해 주세요.' } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    // Get or create session
    let sessionId = body.sessionId;
    if (sessionId) {
      const existingSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });
      if (!existingSession) {
        sessionId = undefined;
      }
    }

    if (!sessionId) {
      const session = await prisma.chatSession.create({
        data: {
          language: language ?? 'ko',
        },
      });
      sessionId = session.id;
    }

    // Rate limit check
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' } satisfies ApiResponse<never>,
        { status: 429 },
      );
    }

    // Step 1: Mask PII
    const { masked: maskedMessage, entries: piiEntries } = maskPii(message);

    // Step 2: Store user message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: message, // Store original (encrypted at DB level in production)
        language: language ?? null,
      },
    });

    // Step 3: Classify intent (using masked message)
    const intentResult = await classifyUserIntent(maskedMessage, language);
    const detectedLanguage = (language ?? intentResult.language) as ChatLanguage;

    // Step 4: Safety check
    const safetyResult = checkSafety(maskedMessage, detectedLanguage, intentResult.intent as Parameters<typeof checkSafety>[2]);

    let responseMessage: string;
    let isEscalated = false;
    let sources: string[] = [];

    if (!safetyResult.safe) {
      // Unsafe — escalation or rejection
      responseMessage = safetyResult.response;
      isEscalated = safetyResult.action === 'escalate';

      if (isEscalated) {
        // Update session escalation status
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { isEscalated: true, escalatedAt: new Date() },
        });
      }
    } else {
      // Step 5: Check for canned responses (greetings, thanks)
      const canned = getCannedResponse(intentResult.intent, detectedLanguage);
      if (canned) {
        responseMessage = canned;
      } else {
        // Step 6: Search FAQ
        const faq = searchFAQByIntent(intentResult.intent);
        if (faq) {
          const faqResult = getFAQAnswer(faq, detectedLanguage);
          responseMessage = faqResult.answer;
          sources = faqResult.sources;
        } else {
          // Step 7: Claude API fallback
          // Fetch recent conversation history for context
          const recentMessages = await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { role: true, content: true },
          });

          const history = recentMessages
            .reverse()
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: maskPii(m.content).masked,
            }));

          // Remove the last user message (we'll send it separately)
          if (history.length > 0 && history[history.length - 1].role === 'user') {
            history.pop();
          }

          const claudeResponse = await generateResponse(maskedMessage, history, detectedLanguage);
          // Unmask any placeholder references in the response
          responseMessage = unmaskPii(claudeResponse, piiEntries);
        }
      }
    }

    // Step 8: Store assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: responseMessage,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        language: detectedLanguage,
        isEscalated,
        sources: sources.length > 0 ? sources : undefined,
      },
    });

    const responseData: ChatResponse = {
      sessionId,
      message: responseMessage,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      language: detectedLanguage,
      isEscalated,
      sources,
    };

    return NextResponse.json(
      { success: true, data: responseData } satisfies ApiResponse<ChatResponse>,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '채팅 처리 중 오류가 발생했습니다.';
    console.error('[Chat API] Error:', message);
    return NextResponse.json(
      { success: false, error: '채팅 처리 중 오류가 발생했습니다.' } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
