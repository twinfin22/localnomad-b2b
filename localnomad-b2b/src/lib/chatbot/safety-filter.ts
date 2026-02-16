// Safety filter for chatbot — determines if a message requires escalation or rejection
// Pure function, no external dependencies

import type { ChatIntent } from './knowledge-base';
import type { ChatLanguage } from './knowledge-base';

export type SafetyResult =
  | { safe: true }
  | { safe: false; action: 'escalate'; urgent: boolean; response: string }
  | { safe: false; action: 'reject'; response: string };

// Escalation keywords per language — messages containing these trigger escalation
const ESCALATION_KEYWORDS: Record<string, Record<string, string[]>> = {
  legal: {
    ko: ['법률 상담', '변호사', '소송', '법적 조치', '강제 퇴거', '고발', '행정소송'],
    en: ['legal advice', 'lawyer', 'lawsuit', 'legal action', 'deportation', 'sue'],
    zh: ['法律咨询', '律师', '诉讼', '法律行动', '强制遣返'],
    vi: ['tư vấn pháp luật', 'luật sư', 'kiện', 'hành động pháp lý', 'trục xuất'],
  },
  prediction: {
    ko: ['합격 가능성', '승인될까요', '허가 받을 수 있나요', '확률', '결과 예측'],
    en: ['will i be approved', 'chances of approval', 'will i get', 'predict', 'guarantee'],
    zh: ['能批准吗', '通过率', '预测结果', '保证'],
    vi: ['có được duyệt không', 'khả năng', 'dự đoán', 'bảo đảm'],
  },
  overstay: {
    ko: ['불법체류 중', '비자 만료됐', '오버스테이 중', '불체자', '미등록 체류'],
    en: ['currently overstaying', 'my visa expired', 'illegal stay', 'undocumented'],
    zh: ['正在非法滞留', '签证已过期', '逾期滞留中'],
    vi: ['đang quá hạn', 'visa đã hết hạn', 'lưu trú bất hợp pháp'],
  },
  case_specific: {
    ko: ['내 경우', '내 상황', '저의 경우', '제 경우'],
    en: ['in my case', 'my situation', 'my specific case'],
    zh: ['我的情况', '我的案例'],
    vi: ['trường hợp của tôi', 'tình huống của tôi'],
  },
};

// PII request keywords — messages requesting to see someone's PII
const PII_REQUEST_KEYWORDS: Record<string, string[]> = {
  ko: ['여권번호 알려줘', '주민번호', '외국인등록번호 알려', '비밀번호', '개인정보 조회'],
  en: ['passport number', 'show me their', 'social security', 'personal information'],
  zh: ['护照号码', '身份证号', '个人信息'],
  vi: ['số hộ chiếu', 'số chứng minh', 'thông tin cá nhân'],
};

// Escalation response messages per language
const ESCALATION_RESPONSES: Record<string, Record<string, string>> = {
  legal: {
    ko: '⚠️ **법률 관련 질문은 AI가 답변할 수 없습니다.**\n\n정확한 법률 상담을 위해 담당자에게 연결해 드리겠습니다.\n\n📞 긴급한 경우 1345 (외국인종합안내센터)로 연락하실 수 있습니다.',
    en: '⚠️ **Legal questions cannot be answered by AI.**\n\nI will connect you with a staff member for accurate legal guidance.\n\n📞 For urgent matters, call 1345 (Foreigner Information Center).',
    zh: '⚠️ **法律相关问题AI无法回答。**\n\n为了准确的法律咨询，将为您转接工作人员。\n\n📞 紧急情况请拨打1345（外国人综合咨询中心）。',
    vi: '⚠️ **Câu hỏi pháp lý không thể được AI trả lời.**\n\nTôi sẽ kết nối bạn với nhân viên để được tư vấn chính xác.\n\n📞 Trường hợp khẩn cấp, gọi 1345 (Trung tâm Thông tin Người nước ngoài).',
  },
  prediction: {
    ko: '⚠️ **결과 예측은 AI가 판단할 수 없습니다.**\n\n비자 심사 결과는 출입국관리사무소에서만 결정됩니다. 정확한 안내를 위해 담당자에게 연결해 드리겠습니다.',
    en: '⚠️ **AI cannot predict application outcomes.**\n\nVisa decisions are made solely by the Immigration Office. I will connect you with a staff member for guidance.',
    zh: '⚠️ **AI无法预测申请结果。**\n\n签证审批由出入境管理事务所决定。将为您转接工作人员。',
    vi: '⚠️ **AI không thể dự đoán kết quả đơn.**\n\nQuyết định visa do Văn phòng Di trú đưa ra. Tôi sẽ kết nối bạn với nhân viên.',
  },
  overstay: {
    ko: '🚨 **긴급: 불법체류 상황은 즉시 조치가 필요합니다.**\n\n담당자에게 긴급 연결합니다. 가능한 빠르게 답변드리겠습니다.\n\n📞 1345 (외국인종합안내센터)에서도 도움을 받으실 수 있습니다.',
    en: '🚨 **URGENT: Overstay situations require immediate action.**\n\nConnecting you with a staff member urgently. We will respond as soon as possible.\n\n📞 You can also call 1345 (Foreigner Information Center) for help.',
    zh: '🚨 **紧急：非法滞留需要立即处理。**\n\n正在紧急转接工作人员。我们会尽快回复。\n\n📞 也可拨打1345（外国人综合咨询中心）求助。',
    vi: '🚨 **KHẨN CẤP: Tình trạng quá hạn cần xử lý ngay.**\n\nĐang kết nối khẩn cấp với nhân viên. Chúng tôi sẽ phản hồi sớm nhất.\n\n📞 Bạn cũng có thể gọi 1345 (Trung tâm Thông tin Người nước ngoài).',
  },
  case_specific: {
    ko: '📋 **개별 사례에 대한 상담은 담당자 확인이 필요합니다.**\n\n정확한 안내를 위해 담당자에게 연결해 드리겠습니다.',
    en: '📋 **Case-specific questions need staff review.**\n\nI will connect you with a staff member for accurate guidance.',
    zh: '📋 **个别情况需要工作人员确认。**\n\n将为您转接工作人员以获得准确指导。',
    vi: '📋 **Câu hỏi về trường hợp cụ thể cần nhân viên xem xét.**\n\nTôi sẽ kết nối bạn với nhân viên.',
  },
};

const PII_REJECTION_RESPONSES: Record<string, string> = {
  ko: '🔒 **개인정보 보호 정책에 따라 개인정보를 제공할 수 없습니다.**\n\n여권번호, 외국인등록번호 등 개인정보는 시스템에서 조회할 수 없습니다.',
  en: '🔒 **Personal information cannot be provided per our privacy policy.**\n\nPassport numbers, ARC numbers, and other personal information cannot be retrieved through this chat.',
  zh: '🔒 **根据隐私政策，无法提供个人信息。**\n\n护照号码、外国人登录号等个人信息无法通过聊天查询。',
  vi: '🔒 **Không thể cung cấp thông tin cá nhân theo chính sách bảo mật.**\n\nSố hộ chiếu, số ARC và thông tin cá nhân khác không thể tra cứu qua chat.',
};

/**
 * Check if a message matches escalation or PII request keywords.
 * Returns the matched intent category or null.
 */
const matchKeywords = (
  text: string,
  language: string,
): { intent: ChatIntent; category: string } | null => {
  const lowerText = text.toLowerCase();
  const lang = language as ChatLanguage;

  // Check PII request keywords first
  const piiKeywords = PII_REQUEST_KEYWORDS[lang] ?? PII_REQUEST_KEYWORDS['ko'];
  for (const keyword of piiKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return { intent: 'pii_request', category: 'pii' };
    }
  }

  // Check escalation keywords
  for (const [category, langKeywords] of Object.entries(ESCALATION_KEYWORDS)) {
    const keywords = langKeywords[lang] ?? langKeywords['ko'];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        const intentMap: Record<string, ChatIntent> = {
          legal: 'escalation_legal',
          prediction: 'escalation_prediction',
          overstay: 'escalation_overstay',
          case_specific: 'escalation_case_specific',
        };
        return { intent: intentMap[category], category };
      }
    }
  }

  return null;
};

/**
 * Check safety of a classified intent.
 * Returns safe=true for FAQ intents, escalation/rejection for unsafe intents.
 */
export const checkSafetyByIntent = (
  intent: ChatIntent,
  language: string,
): SafetyResult => {
  const lang = (language || 'ko') as ChatLanguage;

  switch (intent) {
    case 'escalation_legal': {
      const response = ESCALATION_RESPONSES['legal'][lang] ?? ESCALATION_RESPONSES['legal']['ko'];
      return { safe: false, action: 'escalate', urgent: false, response };
    }
    case 'escalation_prediction': {
      const response = ESCALATION_RESPONSES['prediction'][lang] ?? ESCALATION_RESPONSES['prediction']['ko'];
      return { safe: false, action: 'escalate', urgent: false, response };
    }
    case 'escalation_overstay': {
      const response = ESCALATION_RESPONSES['overstay'][lang] ?? ESCALATION_RESPONSES['overstay']['ko'];
      return { safe: false, action: 'escalate', urgent: true, response };
    }
    case 'escalation_case_specific': {
      const response = ESCALATION_RESPONSES['case_specific'][lang] ?? ESCALATION_RESPONSES['case_specific']['ko'];
      return { safe: false, action: 'escalate', urgent: false, response };
    }
    case 'pii_request': {
      const response = PII_REJECTION_RESPONSES[lang] ?? PII_REJECTION_RESPONSES['ko'];
      return { safe: false, action: 'reject', response };
    }
    default:
      return { safe: true };
  }
};

/**
 * Full safety check: keyword match on raw text + intent-based check.
 * Called before FAQ/Claude response generation.
 */
export const checkSafety = (
  text: string,
  language: string,
  classifiedIntent?: ChatIntent,
): SafetyResult => {
  // First check keywords in the raw text
  const keywordMatch = matchKeywords(text, language);
  if (keywordMatch) {
    return checkSafetyByIntent(keywordMatch.intent, language);
  }

  // Then check the classified intent (from classifier)
  if (classifiedIntent) {
    return checkSafetyByIntent(classifiedIntent, language);
  }

  return { safe: true };
};

/**
 * Get escalation keywords for all categories and languages.
 * Used by the intent classifier to augment keyword matching.
 */
export const getEscalationKeywords = (): Map<string, ChatIntent> => {
  const keywordMap = new Map<string, ChatIntent>();

  const intentMap: Record<string, ChatIntent> = {
    legal: 'escalation_legal',
    prediction: 'escalation_prediction',
    overstay: 'escalation_overstay',
    case_specific: 'escalation_case_specific',
  };

  for (const [category, langKeywords] of Object.entries(ESCALATION_KEYWORDS)) {
    for (const keywords of Object.values(langKeywords)) {
      for (const keyword of keywords) {
        keywordMap.set(keyword.toLowerCase(), intentMap[category]);
      }
    }
  }

  // Add PII request keywords
  for (const keywords of Object.values(PII_REQUEST_KEYWORDS)) {
    for (const keyword of keywords) {
      keywordMap.set(keyword.toLowerCase(), 'pii_request');
    }
  }

  return keywordMap;
};
