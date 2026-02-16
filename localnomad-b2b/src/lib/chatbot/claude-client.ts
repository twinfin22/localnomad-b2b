// Anthropic Claude API wrapper for chatbot
// Uses haiku for classification, sonnet for response generation

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
});

// System prompt for the chatbot — guides response style and safety
const CHAT_SYSTEM_PROMPT = `You are an AI assistant for a Korean university's International Office (국제교류처).
You help foreign students with visa-related questions, immigration procedures, and university life in Korea.

IMPORTANT RULES:
1. Answer only based on Korean immigration law and regulations.
2. Never provide legal advice — recommend consulting a lawyer or calling 1345 for legal questions.
3. Never predict visa approval/denial outcomes.
4. Never share, request, or display personal information (passport numbers, ARC numbers, phone numbers, etc.).
5. If unsure, recommend the student visit the International Office or call 1345.
6. Be concise and helpful. Use bullet points for steps.
7. Always cite relevant laws or official resources when possible.
8. Respond in the same language as the user's message.
9. For Uzbek/Mongolian, respond in Korean with a note that the service is primarily available in Korean, English, Chinese, and Vietnamese.

You are a TOOL that provides general information — you are NOT a replacement for professional legal advice or immigration officer decisions.`;

// System prompt for intent classification
const CLASSIFIER_SYSTEM_PROMPT = `You are an intent classifier for a Korean university visa chatbot.
Classify the user's message into exactly one of these intents:

FAQ intents:
- visa_extension: Questions about extending/renewing a visa
- visa_documents: Questions about required documents for visa applications
- address_change: Questions about reporting address changes
- part_time_work: Questions about part-time work permits
- health_insurance: Questions about health insurance requirements
- immigration_office: Questions about immigration office locations/hours
- fims_report: Questions about FIMS reporting
- reentry_permit: Questions about re-entry permits
- visa_type_change: Questions about changing visa types
- overstay_penalty: Questions about overstay penalties/consequences
- enrollment_leave: Questions about leave of absence procedures
- graduation_visa: Questions about post-graduation visa options
- emergency_contact: Questions about emergency contacts
- scholarship_info: Questions about scholarships
- dormitory_info: Questions about dormitory/housing

Escalation intents (require human staff):
- escalation_legal: Legal advice requests, lawsuit mentions, deportation fears
- escalation_prediction: Asking for approval predictions/guarantees
- escalation_overstay: Currently overstaying (urgent, needs immediate help)
- escalation_case_specific: Asking about their specific case (needs case review)
- pii_request: Requesting personal information of any person

General:
- general_greeting: Greetings, hello, hi
- general_thanks: Thank you, thanks
- general_unknown: Cannot classify

Respond with ONLY a JSON object: {"intent": "intent_name", "confidence": 0.0-1.0, "language": "detected_language_code"}
Language codes: ko, en, zh, vi, uz, mn`;

export interface ClassificationResult {
  intent: string;
  confidence: number;
  language: string;
}

/**
 * Classify user intent using Claude Haiku (fast, cheap).
 * Returns intent, confidence, and detected language.
 */
export const classifyIntent = async (
  maskedMessage: string,
): Promise<ClassificationResult> => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: CLASSIFIER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: maskedMessage }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult;
      return {
        intent: parsed.intent || 'general_unknown',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        language: parsed.language || 'ko',
      };
    }

    return { intent: 'general_unknown', confidence: 0.5, language: 'ko' };
  } catch (error: unknown) {
    console.error('[Claude Classifier] Error:', error instanceof Error ? error.message : error);
    return { intent: 'general_unknown', confidence: 0, language: 'ko' };
  }
};

/**
 * Generate a chat response using Claude Sonnet (higher quality).
 * The message must be PII-masked before calling this.
 */
export const generateResponse = async (
  maskedMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  language: string,
): Promise<string> => {
  try {
    // Build messages with recent history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...recentHistory,
      { role: 'user', content: maskedMessage },
    ];

    const languageHint = language !== 'ko'
      ? `\n\nRespond in ${language === 'en' ? 'English' : language === 'zh' ? 'Chinese' : language === 'vi' ? 'Vietnamese' : 'Korean'}.`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      system: CHAT_SYSTEM_PROMPT + languageHint,
      messages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return text || '죄송합니다. 답변을 생성하지 못했습니다. 국제교류처에 직접 문의해 주세요.';
  } catch (error: unknown) {
    console.error('[Claude Response] Error:', error instanceof Error ? error.message : error);
    return '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
};

// Greeting responses per language
const GREETING_RESPONSES: Record<string, string> = {
  ko: '안녕하세요! 🙋 유학생 비자 및 체류 관련 상담 AI입니다.\n\n궁금한 것을 물어보세요. 예:\n- 비자 연장 방법\n- 아르바이트 허가\n- 주소 변경 신고\n- 건강보험 안내',
  en: "Hello! 🙋 I'm the AI counselor for international student visa and stay-related questions.\n\nFeel free to ask about:\n- Visa extension\n- Part-time work permits\n- Address change reporting\n- Health insurance",
  zh: '你好！🙋 我是留学生签证及居留相关咨询AI。\n\n请随时提问：\n- 签证延期方法\n- 兼职工作许可\n- 地址变更申报\n- 健康保险',
  vi: 'Xin chào! 🙋 Tôi là AI tư vấn về visa và cư trú cho sinh viên quốc tế.\n\nHãy hỏi về:\n- Gia hạn visa\n- Giấy phép làm thêm\n- Báo thay đổi địa chỉ\n- Bảo hiểm y tế',
};

const THANKS_RESPONSES: Record<string, string> = {
  ko: '도움이 되었다면 기쁩니다! 😊 다른 궁금한 점이 있으면 언제든 물어보세요.',
  en: "Glad I could help! 😊 Feel free to ask if you have more questions.",
  zh: '很高兴能帮到您！😊 如果还有其他问题，请随时提问。',
  vi: 'Rất vui được giúp đỡ! 😊 Nếu có câu hỏi khác, hãy hỏi bất cứ lúc nào.',
};

/**
 * Get a canned response for greetings and thanks.
 */
export const getCannedResponse = (
  intent: string,
  language: string,
): string | null => {
  if (intent === 'general_greeting') {
    return GREETING_RESPONSES[language] ?? GREETING_RESPONSES['ko'];
  }
  if (intent === 'general_thanks') {
    return THANKS_RESPONSES[language] ?? THANKS_RESPONSES['ko'];
  }
  return null;
};
