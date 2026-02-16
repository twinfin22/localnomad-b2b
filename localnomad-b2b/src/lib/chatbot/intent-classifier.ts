// Intent classifier: keyword-first with Claude fallback
// Saves ~50-70% API calls by matching common keywords directly

import type { ChatIntent, ChatLanguage } from './knowledge-base';
import { getAllKeywords } from './knowledge-base';
import { getEscalationKeywords } from './safety-filter';
import { classifyIntent as claudeClassify } from './claude-client';

export interface IntentResult {
  intent: ChatIntent | 'general_greeting' | 'general_thanks' | 'general_unknown';
  confidence: number;
  language: string;
  source: 'keyword' | 'claude';
}

// Greeting keywords per language
const GREETING_KEYWORDS: Record<string, string[]> = {
  ko: ['안녕하세요', '안녕', '반갑습니다', '여보세요', '처음입니다'],
  en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
  zh: ['你好', '您好', '早上好', '下午好'],
  vi: ['xin chào', 'chào bạn', 'chào'],
};

// Thanks keywords per language
const THANKS_KEYWORDS: Record<string, string[]> = {
  ko: ['감사합니다', '고맙습니다', '고마워요', '감사해요', '감사'],
  en: ['thank you', 'thanks', 'thank', 'appreciate'],
  zh: ['谢谢', '感谢', '多谢'],
  vi: ['cảm ơn', 'cám ơn'],
};

// Detect language from message content
const detectLanguage = (text: string): ChatLanguage => {
  // Korean: contains Hangul characters
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  // Chinese: contains CJK unified ideographs (exclude Korean)
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  // Vietnamese: contains Vietnamese-specific diacritics
  if (/[ăâđêôơư]|[\u1EA0-\u1EF9]/i.test(text)) return 'vi';
  // Uzbek: contains Uzbek-specific characters (ʻ, oʻ)
  if (/[ʻ]/.test(text) || /o['ʻ]z/i.test(text)) return 'uz';
  // Mongolian: contains Cyrillic characters
  if (/[\u0400-\u04FF]/.test(text)) return 'mn';
  // Default to English
  return 'en';
};

/**
 * Match keywords against the message.
 * Returns the best matching intent with confidence score.
 */
const matchKeywords = (
  text: string,
  language: ChatLanguage,
): IntentResult | null => {
  const lowerText = text.toLowerCase();

  // Check greetings first (short messages)
  if (text.length < 30) {
    for (const [lang, keywords] of Object.entries(GREETING_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return {
            intent: 'general_greeting',
            confidence: 0.95,
            language: lang === language ? language : language,
            source: 'keyword',
          };
        }
      }
    }
  }

  // Check thanks
  for (const keywords of Object.values(THANKS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return {
          intent: 'general_thanks',
          confidence: 0.95,
          language,
          source: 'keyword',
        };
      }
    }
  }

  // Check escalation keywords (higher priority than FAQ)
  const escalationKeywords = getEscalationKeywords();
  for (const [keyword, intent] of escalationKeywords) {
    if (lowerText.includes(keyword)) {
      return {
        intent,
        confidence: 0.95,
        language,
        source: 'keyword',
      };
    }
  }

  // Check FAQ keywords
  const faqKeywords = getAllKeywords(language);
  let bestMatch: { intent: string; score: number } | null = null;

  for (const [keyword, intent] of faqKeywords) {
    if (lowerText.includes(keyword)) {
      // Score based on keyword length relative to message length
      // Longer keyword match = higher confidence
      const score = keyword.length / Math.max(lowerText.length, 1);
      const confidence = Math.min(0.95, 0.7 + score);

      if (!bestMatch || confidence > bestMatch.score) {
        bestMatch = { intent, score: confidence };
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.90) {
    return {
      intent: bestMatch.intent as ChatIntent,
      confidence: bestMatch.score,
      language,
      source: 'keyword',
    };
  }

  // Below threshold — return partial match for logging, but will fall through to Claude
  return bestMatch
    ? {
        intent: bestMatch.intent as ChatIntent,
        confidence: bestMatch.score,
        language,
        source: 'keyword',
      }
    : null;
};

/**
 * Classify user intent.
 * Strategy: keyword match first, Claude API fallback if confidence < 0.90.
 */
export const classifyUserIntent = async (
  maskedMessage: string,
  explicitLanguage?: string,
): Promise<IntentResult> => {
  const language = (explicitLanguage as ChatLanguage) || detectLanguage(maskedMessage);

  // Step 1: Try keyword matching
  const keywordResult = matchKeywords(maskedMessage, language);

  if (keywordResult && keywordResult.confidence >= 0.90) {
    return { ...keywordResult, language };
  }

  // Step 2: Fall back to Claude for classification
  try {
    const claudeResult = await claudeClassify(maskedMessage);
    return {
      intent: claudeResult.intent as ChatIntent | 'general_greeting' | 'general_thanks' | 'general_unknown',
      confidence: claudeResult.confidence,
      language: claudeResult.language || language,
      source: 'claude',
    };
  } catch {
    // If Claude fails, use keyword result if available, otherwise unknown
    return keywordResult ?? {
      intent: 'general_unknown',
      confidence: 0,
      language,
      source: 'keyword',
    };
  }
};

export { detectLanguage };
