# LocalNomad B2B Visa Dashboard — Day 7: AI Chatbot MVP + Safety Filter + Escalation

> **Prerequisites**: Day 1-6 complete. Notification system backend and UI are done. Now build the AI chatbot for foreign students.
> **Today's Goal**: Build the AI multilingual chatbot backend (intent classification + response generation + safety filter + escalation) and the web chat widget UI.
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` (§4.1-4.5) first.
> **CRITICAL SECURITY**: Never send raw PII (passport numbers, ARC numbers) to the Claude API. All PII must be masked before any LLM call.

---

## ⚠️ Decision-Making Rules (Must Follow)

The founder may be unavailable while this prompt is running. Follow the Decision-Making Rules in `CLAUDE.md`:

### Decide on your own (don't ask):
- Library/package version choices, import ordering, code formatting
- File/folder naming within established conventions
- Error message wording (must be in Korean, user-friendly)
- UI spacing, padding, column widths — minor adjustments within the design system
- Build errors, lint fixes

### Must stop and wait:
- Adding new packages/dependencies not in the tech stack
- DB schema changes
- Auth/authorization logic changes
- Encryption or PII handling changes
- Deviating from the spec
- API response format or endpoint structure changes

If blocked → document the question clearly → move on to the next independent Task.

---

## Task 1: PII Masking Pipeline

Create `src/lib/pii-masker.ts`

**CRITICAL**: This module ensures no raw PII is ever sent to the Claude API.

### 1-1. Masking Function

```typescript
interface MaskResult {
  maskedText: string;
  maskMap: Map<string, string>;  // placeholder → original value
}

function maskPii(text: string): MaskResult
function unmaskPii(text: string, maskMap: Map<string, string>): string
```

**Patterns to detect and mask:**
- Passport numbers: Replace with `[PASSPORT_1]`, `[PASSPORT_2]`, etc.
  - Pattern: letter followed by 7-9 digits (e.g., M12345678)
- ARC numbers (외국인등록번호): Replace with `[ARC_1]`, etc.
  - Pattern: 13 digits with hyphens (e.g., 123456-1234567)
- Phone numbers: Replace with `[PHONE_1]`, etc.
  - Pattern: Korean (010-XXXX-XXXX) and international formats
- Email addresses: Replace with `[EMAIL_1]`, etc.
- Korean resident numbers (주민등록번호): Replace with `[RRN_1]`, etc.
  - Pattern: 6 digits-7 digits

**Important:**
- Return a `maskMap` that allows reversing the mask after LLM response
- The `unmaskPii` function should replace placeholders back with originals
- Must handle multiple occurrences of PII in the same text
- Must not false-positive on dates, student IDs, or visa type codes (D-2-2, etc.)

### 1-2. Unit Tests

Create `src/lib/__tests__/pii-masker.test.ts`

Test cases:
1. Passport number detected and masked
2. ARC number detected and masked
3. Phone number (Korean format) detected and masked
4. Email detected and masked
5. Multiple PII types in one text all masked
6. Visa type codes (D-2-2) NOT masked (false positive prevention)
7. Dates NOT masked
8. unmaskPii correctly restores original values
9. Text with no PII passes through unchanged

---

## Task 2: AI Chatbot Backend

### 2-1. Chat API

Create `src/app/api/chat/route.ts`

POST /api/chat — Handles student chat messages.

**Request:**
```json
{
  "message": "D-2 비자 연장하려면 뭐가 필요해요?",
  "sessionId": "chat-session-uuid",
  "language": "ko"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "D-2 비자 연장을 위해서는 다음 서류가 필요합니다...",
    "language": "ko",
    "intent": "visa_extension",
    "confidence": 0.95,
    "escalated": false,
    "sources": ["출입국관리법 제25조", "FIMS 가이드라인"]
  }
}
```

**Flow:**
1. Receive message
2. Mask PII (`maskPii()`)
3. Detect language (from request or auto-detect)
4. Classify intent
5. Check safety filter (is this Out of Scope?)
6. If safe: Generate response using Claude API with system prompt
7. If unsafe: Return escalation response + create escalation ticket
8. Unmask any PII in response (shouldn't be any, but safety check)
9. Store chat message + response in ChatMessage table
10. Return response

**Auth**: This endpoint should be accessible without full session auth (students use it via widget). Use a simple API key or student token approach. For now, make it public but rate-limited (track by IP or sessionId).

### 2-2. Claude API Integration

Create `src/lib/chatbot/claude-client.ts`

Wrapper around the Anthropic Claude API:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

**System Prompt** (stored as constant):

```
You are a helpful multilingual assistant for foreign students studying at Korean universities.

Your role:
- Answer questions about visa procedures, required documents, address change reporting, part-time work permits, health insurance, and immigration office information.
- Respond in the same language as the student's question.
- Be accurate, concise, and friendly.
- Always cite relevant laws or regulations when applicable.

Your limitations:
- NEVER make legal judgments about individual cases (e.g., "will my visa be approved?")
- NEVER predict outcomes of applications
- NEVER provide personal information (passport numbers, ARC numbers, etc.)
- If the question is about an individual's specific situation requiring professional judgment, respond: "이 질문은 담당자 확인이 필요합니다. 국제교류처에 문의가 전달되었습니다." (or equivalent in the detected language)

For low-resource languages (Uzbek, Mongolian):
- Add disclaimer: "⚠️ AI 번역 참고용입니다. 정확한 정보는 국제교류처에 문의하세요."

Respond in the student's language. Keep responses under 500 characters when possible.
```

**Note**: The Anthropic SDK (`@anthropic-ai/sdk`) is in the tech stack (Claude API). Install if not already present: `npm install @anthropic-ai/sdk`

### 2-3. Intent Classifier

Create `src/lib/chatbot/intent-classifier.ts`

Classify the student's intent:

```typescript
type ChatIntent =
  | 'visa_extension'        // 비자 연장
  | 'visa_change'           // 체류자격 변경
  | 'required_documents'    // 구비 서류
  | 'address_change'        // 체류지 변경 신고
  | 'part_time_work'        // 시간제취업
  | 'health_insurance'      // 건강보험
  | 'immigration_office'    // 출입국사무소
  | 'university_faq'        // 대학 내규
  | 'escalation_legal'      // 법적 판단 요청 → escalate
  | 'escalation_prediction' // 허가 가능성 → escalate
  | 'escalation_overstay'   // 불법체류 관련 → urgent escalate
  | 'pii_request'           // 개인정보 요청 → reject
  | 'general'               // 기타 일반
  | 'unknown';              // 분류 불가

function classifyIntent(message: string, language: string): Promise<{ intent: ChatIntent; confidence: number }>
```

**Implementation**: Use Claude API with a lightweight prompt for intent classification. Send the message (after PII masking) and get back the intent + confidence.

Alternatively, for v1, use keyword matching as a fast first pass:
- Keywords for each intent (Korean + English + Chinese + Vietnamese)
- If keyword match confidence > 90%, skip LLM classification
- If no keyword match or low confidence, use Claude API for classification

### 2-4. Safety Filter

Create `src/lib/chatbot/safety-filter.ts`

```typescript
interface SafetyResult {
  safe: boolean;
  reason?: string;
  escalationType?: 'normal' | 'urgent';
  responseMessage?: string;  // Pre-formatted response for unsafe queries
}

function checkSafety(intent: ChatIntent, message: string, language: string): SafetyResult
```

**Rules (from spec §4.2):**

| Intent | Action | Response |
|---|---|---|
| escalation_legal | Escalate (normal) | "이 질문은 담당자 확인이 필요합니다..." (in detected language) |
| escalation_prediction | Escalate (normal) | "이 질문은 담당자 확인이 필요합니다..." |
| escalation_overstay | Escalate (urgent) | "이 질문은 담당자 확인이 필요합니다..." + urgent flag |
| pii_request | Reject (no escalation) | "개인정보는 시스템에서 직접 조회해주세요." |

Provide responses in 4 languages (Korean, English, Chinese, Vietnamese). For Uzbek/Mongolian, use Korean with disclaimer.

---

## Task 3: Escalation System

### 3-1. Escalation API

Create `src/app/api/chat/escalate/route.ts`

POST /api/chat/escalate — Creates an escalation ticket when the chatbot can't answer.

**Request:**
```json
{
  "sessionId": "chat-session-uuid",
  "studentMessage": "제가 비자 연장이 거절될까요?",
  "aiAnalysis": "Student is asking for a prediction about visa extension approval. This requires professional judgment.",
  "intent": "escalation_legal",
  "priority": "normal",
  "language": "ko",
  "studentId": "optional-student-uuid"
}
```

**Behavior:**
1. Create a ChatMessage record with `isEscalated: true`
2. Create an AlertLog for the staff (type: GENERAL, channel: IN_APP)
3. If priority is "urgent", also send EMAIL notification to staff
4. Return ticket info

### 3-2. Staff Ticket Dashboard

Create `src/components/chat/escalation-list.tsx`

A component for the staff dashboard showing escalation tickets:
- List of pending escalation tickets
- Each ticket shows: student name (if linked), message preview, priority badge (긴급/일반), language, timestamp
- Click → expands to show full conversation + AI analysis
- "답변하기" (Reply) button → opens reply input
- Staff reply gets stored as ChatMessage and (optionally) sent back to the student

### 3-3. Staff Reply API

Create `src/app/api/chat/[sessionId]/reply/route.ts`

POST /api/chat/:sessionId/reply — Staff replies to an escalation.

**Request:**
```json
{
  "message": "D-2 비자 연장은 출석률 80% 이상이면 일반적으로 승인됩니다. 서류를 준비해서 국제교류처에 방문해주세요.",
  "resolveEscalation": true
}
```

**Behavior:**
1. Auth required + RBAC (MANAGER/ADMIN)
2. Create ChatMessage with sender='staff'
3. If resolveEscalation: mark the escalation as resolved
4. Return the reply message

---

## Task 4: Chat Widget UI

### 4-1. Chat Widget Component

Create `src/components/chat/chat-widget.tsx`

A floating chat widget (bottom-right corner):

- Floating button: 💬 icon with "상담하기" tooltip
- Click → opens chat panel (400px wide × 500px tall)
- Header: "AI 유학생 상담" + language selector dropdown + close button
- Message area (scrollable):
  - Student messages: right-aligned, blue background
  - AI responses: left-aligned, gray background
  - Escalation messages: yellow background with "담당자에게 전달되었습니다" label
  - Staff replies: left-aligned, green background with "담당자" badge
  - Timestamps on each message
- Input area: text input + send button
- Typing indicator while AI is processing
- Language selector: 한국어, English, 中文, Tiếng Việt, O'zbek, Монгол

### 4-2. Chat Store

Create `src/store/chat-store.ts`

```typescript
interface ChatStore {
  sessionId: string;
  messages: ChatMessage[];
  language: string;
  isOpen: boolean;
  isTyping: boolean;

  openChat: () => void;
  closeChat: () => void;
  setLanguage: (lang: string) => void;
  sendMessage: (text: string) => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
}
```

### 4-3. Chat History API

Create `src/app/api/chat/[sessionId]/route.ts`

GET /api/chat/:sessionId — Returns chat history for a session.

Response:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "...",
        "sender": "student",
        "content": "D-2 비자 연장하려면 뭐가 필요해요?",
        "language": "ko",
        "createdAt": "2026-02-16T10:30:00Z"
      },
      {
        "id": "...",
        "sender": "ai",
        "content": "D-2 비자 연장을 위해서는...",
        "language": "ko",
        "createdAt": "2026-02-16T10:30:03Z"
      }
    ]
  }
}
```

### 4-4. Integrate Chat Widget

Add the ChatWidget to the dashboard layout so it appears on all dashboard pages:
- Only visible to logged-in users (for Phase 1, staff can test the chatbot)
- In the future (Phase 2), it will be a public-facing widget for students

---

## Task 5: Knowledge Base (Static FAQ for v1)

Since Pinecone/RAG setup requires infrastructure (W0 dependency), create a static knowledge base for v1:

### 5-1. FAQ Data

Create `src/lib/chatbot/knowledge-base.ts`

A hardcoded FAQ knowledge base covering the In Scope topics:

```typescript
interface FAQItem {
  intent: ChatIntent;
  keywords: { ko: string[]; en: string[]; zh: string[]; vi: string[] };
  answer: {
    ko: string;
    en: string;
    zh: string;
    vi: string;
  };
  sources: string[];
}
```

Populate with at least 15-20 FAQ items covering:

1. **Visa Extension (D-2)**: Required documents, process, timeline
2. **Visa Extension (D-4)**: Same for language program students
3. **Visa Status Change**: D-4 → D-2 process
4. **Address Change Reporting**: 14-day deadline, where to report
5. **Part-time Work Permit**: Requirements, hour limits (20h/week during semester)
6. **Health Insurance**: Enrollment requirement, NHIS registration
7. **Immigration Office Locations**: Major offices (Seoul, Incheon, Suwon, etc.)
8. **Re-entry Permit**: When needed, how to apply
9. **Attendance Rate**: Minimum requirements, consequences of low attendance
10. **FIMS Reporting**: What it is, why students should care
11. **Scholarship Info**: General guidance (university-specific in Phase 2)
12. **Dormitory**: General guidance
13. **Visa Expiry Warning**: What to do when visa is about to expire
14. **Overstay Consequences**: Fines, re-entry ban, IEQAS impact
15. **Emergency Contacts**: Immigration hotline 1345, police 112

All answers should be accurate based on Korean immigration law as of 2025.

### 5-2. FAQ Search

```typescript
function searchFAQ(query: string, language: string, intent?: ChatIntent): FAQItem | null
```

Simple keyword matching against the FAQ. If found, return the FAQ answer directly (no need to call Claude API). If not found, fall through to Claude API for response generation.

This creates a fast path for common questions (no API latency) and reduces Claude API costs.

---

## Task 6: Verification Checklist

After all Tasks are complete, **run** the following checks and output the results.

### 6-1. Build
```bash
cd localnomad-b2b && npm run build
```
- [ ] 0 build errors

### 6-2. Tests
```bash
cd localnomad-b2b && npm run test
```
- [ ] All PII masker tests pass
- [ ] All traffic light tests still pass

### 6-3. PII Security (CRITICAL)
```bash
grep -rn "anthropic\|claude\|llm\|ai.*api\|sendMessage\|generateResponse" src/lib/chatbot/ src/app/api/chat/ --include="*.ts" --include="*.tsx" | grep -v "mask\|masked\|pii\|import\|interface\|type \|// "
```
- [ ] Every code path that calls Claude API passes through `maskPii()` first
- [ ] No raw student data (passport, ARC, phone) reaches the LLM
- [ ] PII masker test coverage includes all PII types

### 6-4. Safety Filter
- [ ] Legal judgment questions trigger escalation
- [ ] Prediction questions trigger escalation
- [ ] Overstay questions trigger URGENT escalation
- [ ] PII requests are rejected (no escalation, just rejection)
- [ ] Escalation responses are multilingual (KO/EN/ZH/VI minimum)

### 6-5. Korean UI
- [ ] Chat widget all Korean labels
- [ ] Escalation list all Korean labels
- [ ] FAQ answers available in 4+ languages

### 6-6. Spec Compliance
- [ ] Chat API response time < 5 seconds (for FAQ answers, should be instant; for Claude API, depends on API latency)
- [ ] Escalation creates AlertLog for staff
- [ ] Staff can reply to escalations
- [ ] Language auto-detection or manual selection works
- [ ] Low-resource language disclaimer added for Uzbek/Mongolian

**If all items PASS, Day 7 is complete. If any item FAILS, fix it and re-check.**
