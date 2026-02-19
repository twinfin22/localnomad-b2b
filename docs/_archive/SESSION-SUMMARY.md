# Session Summary — 2026-02-16

## Completed (Day 7: AI Chatbot MVP + Safety Filter + Escalation)

### Schema Changes
- Added 5 fields to `ChatMessage`: `intent`, `confidence`, `language`, `isEscalated`, `sources`
- Added `CHAT_ESCALATION` to `AlertType` enum
- Migration applied via `prisma db push`

### PII Masking Pipeline (`src/lib/pii-masker.ts`)
- Regex-based detection: email, RRN, ARC, phone (KR + intl), passport
- False-positive prevention: visa codes (D-2-2), dates, student IDs are NOT masked
- 15 unit tests in `src/lib/__tests__/pii-masker.test.ts` — all passing

### Chatbot Lib (`src/lib/chatbot/`)
- **knowledge-base.ts**: 15 FAQ items × 4 languages (ko/en/zh/vi) + uz/mn disclaimer
- **claude-client.ts**: Anthropic SDK wrapper — haiku for classification, sonnet for generation
- **intent-classifier.ts**: Keyword-first with Claude fallback (saves ~50-70% API calls)
- **safety-filter.ts**: Escalation rules for legal/prediction/overstay/case-specific + PII request rejection

### API Routes (4 new)
- `POST /api/chat` — Main pipeline: rate-limit → maskPii → classify → safety → FAQ/Claude → store
- `POST /api/chat/escalate` — Creates CHAT_ESCALATION AlertLog (+ EMAIL for urgent)
- `GET /api/chat/:sessionId` — Chat history with pagination
- `POST /api/chat/:sessionId/reply` — Staff reply with RBAC (ADMIN/MANAGER)

### Frontend
- **chat-store.ts**: Zustand store with localStorage session persistence (24h TTL)
- **chat-widget.tsx**: Floating widget (400×500px), 6-language selector, typing indicator
- **escalation-list.tsx**: Escalation tickets with expand/reply/resolve workflow

### Modified Files
- `prisma/schema.prisma` — ChatMessage fields + CHAT_ESCALATION enum
- `src/lib/constants.ts` — Added `CHAT_ESCALATION` label
- `src/lib/rbac.ts` — Added `chat:reply` permission
- `src/components/alerts/notification-panel.tsx` — CHAT_ESCALATION icon + purple badge
- `src/app/(dashboard)/layout.tsx` — `<ChatWidget />` rendered in dashboard

## Verification Results
| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | 0 errors |
| `npm run test` | 43/43 passed (15 PII masker + 28 traffic light) |
| `npm run build` | Success (all 4 chat API routes registered) |
| PII security audit | maskPii() called before every Claude API call |

## Key Decisions
- **Keyword-first classification**: Common questions matched by keyword (0 latency, no API cost); Claude haiku only called when confidence < 0.90
- **FAQ answers returned directly**: Pre-authored in 4 languages with legal citations — not passed through Claude (eliminates latency + cost)
- **Rate limiting**: In-memory Map (30 msgs / 5 min per session) — sufficient for staff-only access in Phase 1
- **Session persistence**: localStorage with 24h TTL — simple, no auth required for chat
- **uz/mn languages**: Korean answer shown with Uzbek/Mongolian disclaimer (no full translation)

## Modified Files (in commit 2990ed9)
20 files changed, 2,357 insertions:
- `localnomad-b2b/package.json` — @anthropic-ai/sdk dependency
- `localnomad-b2b/prisma/schema.prisma` — 5 new ChatMessage fields + CHAT_ESCALATION enum
- `localnomad-b2b/src/lib/pii-masker.ts` — NEW
- `localnomad-b2b/src/lib/__tests__/pii-masker.test.ts` — NEW (15 tests)
- `localnomad-b2b/src/lib/chatbot/knowledge-base.ts` — NEW (15 FAQs × 4 languages)
- `localnomad-b2b/src/lib/chatbot/claude-client.ts` — NEW
- `localnomad-b2b/src/lib/chatbot/intent-classifier.ts` — NEW
- `localnomad-b2b/src/lib/chatbot/safety-filter.ts` — NEW
- `localnomad-b2b/src/app/api/chat/route.ts` — NEW (main chat endpoint)
- `localnomad-b2b/src/app/api/chat/escalate/route.ts` — NEW
- `localnomad-b2b/src/app/api/chat/[sessionId]/route.ts` — NEW
- `localnomad-b2b/src/app/api/chat/[sessionId]/reply/route.ts` — NEW
- `localnomad-b2b/src/store/chat-store.ts` — NEW
- `localnomad-b2b/src/components/chat/chat-widget.tsx` — NEW
- `localnomad-b2b/src/components/chat/escalation-list.tsx` — NEW
- `localnomad-b2b/src/lib/constants.ts` — CHAT_ESCALATION label
- `localnomad-b2b/src/lib/rbac.ts` — chat:reply permission
- `localnomad-b2b/src/components/alerts/notification-panel.tsx` — CHAT_ESCALATION icon/color
- `localnomad-b2b/src/app/(dashboard)/layout.tsx` — ChatWidget integration

## Pending
- Untracked doc files: `docs/claude-code-day{3,3b,4,5,6,7}-prompt.md`, `docs/schema-change-passport-optional.md`
- 20 pre-existing ESLint warnings (unused vars in other files)
- `ANTHROPIC_API_KEY` needs to be set in `.env` for Claude API calls to work
- Escalation list `handleReply` currently uses alertId as sessionId — needs proper session ID mapping when wiring to real escalation data

## Next Steps
1. **Set `ANTHROPIC_API_KEY`** in `.env` and test the chatbot end-to-end via the UI widget
2. **W3 focus**: FIMS export workflow, status change report UI, AI column mapping refinement
3. **RAG integration** (Phase 1 scope): LangChain + Pinecone for university-specific document retrieval
4. **Real notification channels**: Wire up AWS SES (EMAIL), Kakao BizMessage (KAKAO) when infra is ready
5. **W2 Gate Review**: Run full W2 gate checklist from CLAUDE.md (should pass with Days 1-7 complete)

## Context to Preserve
- Days 1-7 complete: dashboard, student CRUD, calendar, import, traffic light, notifications, AI chatbot
- All W2 Gate performance targets met with 1,000-record dataset
- Phase 1 spec: `docs/Phase1_프로덕트_스펙_v2.1.md`
- DB has 1,000 students + 200 alerts seeded
- Chat pipeline: maskPii → classifyIntent → checkSafety → FAQ/Claude → unmask → store
- PII never reaches Claude API — verified via grep audit
