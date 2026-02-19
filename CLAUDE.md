# LocalNomad B2B Visa Dashboard

## Session Opener (Cowork Agent — MUST run at session start)

Every time a new Cowork session begins, the agent MUST perform the following checks **before** engaging with Gen's request. Present results as a brief status block at the top of the first response.

### Auto-Check Items:
1. **What day is it?**
   - Friday → "📋 오늘 주간 리뷰 날입니다. 9개 항목 진행할까요?"
   - Monday → "📝 One-Pager 확정 날입니다. 주말에 작성하신 초안이 있으신가요?"

2. **Milestone Gate due?**
   - Check current week number against Milestone Gates (W2/W3/W4/W6) below
   - If a gate is due this week → "🚧 이번 주 W[N] Gate 리뷰가 예정되어 있습니다."

3. **Emergency Brake active?**
   - Read `docs/founder/기술-부채.md` → count 🔴 items. If ≥ 3 → "🛑 Emergency Brake: 🔴 기술 부채 [N]개. 새 기능 추가 불가."
   - Read `docs/founder/의사결정-일지.md` → check for ❌ UNCONFIRMED items → "⚠️ 미확인 의사결정: [항목]"

4. **Overdue rituals?**
   - If last Mental Model Check was >7 days ago → "⏰ Mental Model Check가 밀려 있습니다."
   - If architecture-map.md was last updated >7 days ago and new features were added → "⏰ Architecture Walkthrough가 밀려 있습니다."

### Output Format:
```
━━━ 세션 상태 ━━━
📅 [요일] | W[N] | Phase 1
[해당 알림들]
━━━━━━━━━━━━━━━━
```

If no alerts, show: `✅ 밀린 리추얼 없음. 정상 진행 가능합니다.`

---

## Project Overview

B2B SaaS platform for Korean university international offices to manage foreign student visas, residency status, FIMS (Foreign Student Information Management System) reporting, IEQAS compliance, and multilingual AI counseling.

- **Product**: LocalNomad (로컬노마드)
- **B2C site**: www.localnomad.club
- **Target**: Korean university international affairs offices (Pilot: 3 universities in Asan cluster — Hoseo Univ, Sunmoon Univ, Soonchunhyang Univ)
- **Solo founder** project — heavy use of AI agents for 4-5x productivity

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Table**: TanStack Table (virtual scroll, resize, sort, filter)
- **Backend**: Next.js API Routes (REST)
- **ORM**: Prisma
- **DB**: PostgreSQL 16
- **Cache**: Redis (late Phase 1)
- **AI/LLM**: Claude API (Anthropic) — Haiku (intent classification) + Sonnet (response generation)
- **RAG**: LangChain + Pinecone
- **Notifications**: Kakao BizMessage API + AWS SES + SMS
- **Auth**: NextAuth.js + JWT (Credentials Provider, university email login)
- **Unit Test**: Vitest
- **E2E Test**: Playwright
- **Date Utility**: date-fns
- **Excel Parsing**: SheetJS (xlsx)
- **Deploy**: AWS Seoul Region (EC2/ECS + RDS)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + CloudWatch

## Project Structure

```
localnomad-b2b/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth pages (login)
│   │   ├── (dashboard)/     # Main dashboard (sidebar layout)
│   │   │   ├── students/    # Student management
│   │   │   ├── calendar/    # Visa expiry calendar
│   │   │   ├── fims/        # FIMS status change reports
│   │   │   ├── import/      # Excel import
│   │   │   ├── alerts/      # Notifications
│   │   │   └── settings/    # Settings
│   │   └── api/             # API Routes
│   ├── components/
│   │   ├── layout/          # Sidebar, Header
│   │   ├── students/        # Student-related components
│   │   ├── dashboard/       # Dashboard cards, charts
│   │   └── ui/              # shadcn/ui (auto-generated)
│   ├── lib/                 # prisma, auth, crypto, utils
│   ├── store/               # Zustand stores
│   └── types/               # Type definitions
├── docs/                    # Documentation (.md files — specs, research, prompts)
└── .env                     # Environment variables
```

## Coding Conventions

### Language Rules
- **UI text**: Must be in Korean (target users are Korean university staff). All labels, buttons, placeholders, error messages, tooltips, and any user-facing strings must be in Korean.
- **Code comments**: English
- **Variable/function names**: English camelCase
- **DB columns**: English camelCase (Prisma default)
- **Commit messages**: Korean or English both acceptable

### TypeScript
- Strict mode enabled
- No `any` — always define proper types
- Functional components + React hooks only
- Prefer Server Components; use `"use client"` only when necessary

### Styling
- Tailwind utility classes only (no separate CSS files)
- Maximize use of shadcn/ui components
- Colors: Primary indigo-600, Accent emerald-500, Danger red-500, Warning amber-500
- Font: Pretendard (Korean web font)
- Desktop-first responsive (min 1280px)

### API Design
- REST API via Next.js Route Handlers
- Response format: `{ success: boolean, data?: T, error?: string, meta?: { total, page, limit } }`
- All routes must have try-catch with proper HTTP status codes
- Pagination: `?page=1&limit=20`
- Use soft delete (`isDeleted` flag)

### Security
- PII fields (passport number, ARC number) encrypted with AES-256-GCM
- AuditLog auto-recorded on PII access
- RBAC: ADMIN / MANAGER / VIEWER (3 levels)
- JWT session expiry: 8 hours
- PII must be masked before any LLM API call (never send raw PII to Claude API)
- AWS Seoul Region — domestic data residency required

## Domain Glossary

| Term | Description |
|------|-------------|
| FIMS | Foreign Student Information Management System (https://fims.hikorea.go.kr/). No public API |
| IEQAS | International Education Quality Assurance System. Basic cert: overstay rate <2%, Excellent: <1% |
| 변동신고 (Status Change Report) | Must report to FIMS within 15 days when student status changes (leave/expulsion/withdrawal/graduation/unregistered) |
| 정기보고 (Periodic Report) | Quarterly FIMS report (Feb/May/Aug/Nov) |
| Traffic Light | Student status visualization — GREEN (normal), YELLOW (caution), RED (critical). 3-level system. |
| 단체접수 (Batch Visa) | Bulk visa extension processing (50-80 cases per semester start) |
| 신원보증 (Guarantor) | Immigration Act Article 90 — university president is legal guarantor for foreign students (4-year limit) |

## File Management Rules

- All `.md` documentation files go in `docs/` folder (except this CLAUDE.md)
- `docs/founder/` — Gen이 읽는 문서 (한글)
  - `docs/founder/research/` — Market research, competitor analysis, legal research
  - `docs/founder/spec/` — Product specifications. Latest: `docs/founder/spec/Phase1_프로덕트_스펙_v2.1.md`
  - `docs/founder/[daily] 실행-체크리스트.md` — Daily pre/post execution checklist
  - `docs/founder/[weekly] 멘탈-모델-체크.md` — Weekly mental model check questions
  - `docs/founder/의사결정-일지.md` — Decision log
  - `docs/founder/기술-부채.md` — Tech debt registry
  - `docs/founder/오너-매트릭스.md` — Subsystem owner matrix
- `docs/agent/` — Agents read these docs (English)
  - `docs/agent/prompts/` — Claude Code day prompts
  - `docs/agent/reference/` — Technical reference (architecture-map, pii-data-flow, prompt-templates)
- `docs/_archive/` — Obsolete files (do not reference)

## Dev Commands

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to DB (dev)
npx prisma migrate dev --name [name]  # Create migration
npx prisma studio    # DB GUI browser
```

## Decision-Making Rules

The founder may not always be available to answer questions (e.g., running overnight). Follow these rules:

### Decide on your own (don't ask):
- Library/package version choices
- File/folder naming within established conventions
- Code formatting, refactoring, variable naming
- Error message wording (must be Korean, user-friendly)
- Mock/seed data content
- Build errors and lint fixes
- Import ordering, code organization within files
- UI spacing, padding, minor layout adjustments within the design system

### Must ask before proceeding (block and wait):
- Adding new dependencies not in the tech stack (e.g., new ORM, new UI library)
- Changing DB schema (adding/removing/renaming tables or columns)
- Changing authentication or authorization logic
- Any change to encryption or PII handling
- Deviating from the spec (`docs/founder/spec/Phase1_프로덕트_스펙_v2.1.md`)
- Removing or skipping features listed in the spec
- Changing API response format or endpoint structure
- Pricing, billing, or payment-related decisions
- Anything that could create legal/compliance risk (data residency, PII exposure, guarantor liability)

When blocked, document the question clearly and move on to the next independent task.

## Founder Ownership Workflow (MANDATORY)

This section defines the workflow between the founder (Gen), the Cowork agent, and Claude Code.
These rules exist to ensure the founder maintains full context, judgment, and control over the project.
**Violating these rules accumulates "ownership debt" which is harder to fix than technical debt.**

### Prompt Creation Protocol

1. **Gen provides the skeleton** (feature name, user scenario, DB changes, API needs, 3 success criteria)
2. **Cowork adds the flesh** (detailed specs, component structure, edge cases)
3. **Gen reviews the full prompt before execution** — no execution without Gen's confirmation
4. Claude Code **must never** add features, dependencies, or files beyond what is specified in the prompt

### Decision-Making at Runtime

When Claude Code encounters a decision point:
1. **Present all options with pros/cons** — do NOT recommend a specific option
2. **Include trade-offs** for each option (what you gain, what you lose)
3. **If technical context is needed**, provide a brief explanation at the founder's level (PM with SQL knowledge, not a developer)
4. **Wait for Gen's decision** — do not proceed with the "recommended" option
5. **Log the decision** in `docs/founder/의사결정-일지.md` after Gen decides

### After Completing Each Day's Tasks

Claude Code must provide:
1. **Execution flow explanation** for each new feature:
   - What happens when user takes action X
   - What runs in the browser vs server
   - What gets stored in the DB
   - What appears on screen as a result
2. **New files created** — list with brief purpose
3. **Existing files modified** — list with what changed
4. **New technical debt introduced** (if any)
5. **Any deviations from the prompt** — must be explicitly flagged

### Document Maintenance

These documents must be kept up to date:
- `docs/founder/의사결정-일지.md` — every technical decision with rationale and trade-offs
- `docs/founder/기술-부채.md` — known technical debt with severity and deadlines
- `docs/agent/reference/architecture-map.md` — system structure and data flows (updated weekly)
- `docs/founder/[daily] 실행-체크리스트.md` — pre/post execution checklist

### Complexity Budget

- **Maximum new files per Day prompt**: Must be specified in the prompt by Gen
- If a task would exceed this budget, split into smaller prompts
- Do not create unnecessary files (helpers, utils, wrappers) unless they serve a clear purpose stated in the prompt

### Emergency Brake

Stop all new feature work immediately if:
- 3+ high-severity (🔴) tech debt items are open
- Tests are failing
- Gen says "I don't understand how this works"
- An unauthorized dependency was added

## Verification Checklist

Run this checklist after completing each day's tasks. All items must pass.

### Build
- [ ] `npm run build` — 0 errors
- [ ] `npx prisma generate` — 0 errors
- [ ] No TypeScript `any` types introduced

### UX (Korean UI)
- [ ] All user-facing text is in Korean (grep for hardcoded English labels, buttons, placeholders, tooltips, error messages)
- [ ] No "undefined", "null", or raw variable names visible in UI
- [ ] Error messages are user-friendly Korean (not stack traces or technical jargon)
- [ ] Desktop layout (1280px+) renders without overflow or broken alignment

### Security & Legal
- [ ] `passportNumber` and `arcNumber` are NEVER stored without `encrypt()`
- [ ] PII fields are NEVER logged via `console.log`, error messages, or API responses
- [ ] Every API route filters by `universityId` from session (no cross-tenant data access)
- [ ] Every API route that modifies data checks RBAC role
- [ ] PII access (decrypt) triggers `AuditLog` creation
- [ ] No raw PII passed to any external API (Claude API, etc.)
- [ ] All DELETE operations are soft delete (`isDeleted: true`)

### Spec Compliance
- [ ] API responses follow `{ success: boolean, data?: T, error?: string, meta?: {...} }` format
- [ ] Features match the acceptance criteria in `docs/founder/spec/Phase1_프로덕트_스펙_v2.1.md`
- [ ] No features added that are not in Phase 1 scope (avoid scope creep)

If any item fails, fix it before marking the task as complete.

## Weekly Checkpoints (Cowork Agent Responsibility)

At the end of each week (W1, W2, ...), a deeper review is triggered by the Cowork agent (PM/Architect).
**If the founder forgets to request a weekly review, the Cowork agent should proactively nudge.**

Full checklist and procedures are in `docs/founder/[daily] 실행-체크리스트.md` "주간 리뷰 체크리스트" section.
Below is the summary of all 9 mandatory weekly items:

### 1. Founder Mental Model Check (MANDATORY)
- Select 2-3 questions from `docs/founder/[weekly] 멘탈-모델-체크.md` relevant to this week's work
- Gen writes answers in own words → Cowork marks ✅/⚠️/❌ → diagram re-explanation if needed
- **If Gen cannot answer 2+ questions correctly, trigger Emergency Brake**

### 2. Architecture Walkthrough (MANDATORY)
- Cowork visualizes new data flows added this week
- Gen confirms "이 흐름이 맞다" → architecture-map.md update

### 3. 주간 Self-Demo (MANDATORY)
- Gen opens browser and clicks through this week's features as a user (Persona P1: 김현정)
- Check Korean UI consistency, typos, unnatural phrasing, desktop layout (1280px+)
- Note: this is "사용해보기", not code review

### 4. 기술 부채 리뷰
- tech-debt.md 전체 검토
- 다음 주 위험 예산 결정: "새 기능 N개, 부채 해소 N개"

### 5. 의사결정 일지 리뷰
- decision-log.md에서 "재검토 시점"이 된 항목 확인
- 과거 결정이 여전히 유효한지 평가

### 6. Product Strategy Alignment
- Compare features against `docs/founder/spec/Phase1_프로덕트_스펙_v2.1.md` completion criteria
- Verify Traffic Light logic, IEQAS overstay rate accuracy
- Flag any deviation from spec or scope creep

### 7. Legal & Security Audit
- Trace PII flow end-to-end: input → encrypt → store → decrypt → mask → LLM
- Verify no raw PII to Claude API, AuditLog exists, soft delete only, cross-tenant isolation
- Check "도구 제공" positioning (no 행정사 업무 자동화)

### 8. 외부 의존성 상태 확인
- W0 파일럿 대학 컨택 상태, FIMS 양식 확보 여부, 기타 블로커

### 9. 다음 주 One-Pager 초안
- Gen이 다음 주에 만들 기능의 One-Pager 스켈레톤 작성
- 주말 동안 숙성 → 월요일 확정 → Cowork이 flesh 추가

### Ownership Drift Check (embedded in all above)
- owner-matrix.md 대비: 이번 주 "Gen이 판단해야 했는데 AI가 대신 판단한 항목"이 있었는지 확인
- 발견 시 decision-log.md에 기록 + 재발 방지책 논의

## Milestone Gates

Critical go/no-go checkpoints at major transitions. These are deeper than weekly reviews.
Session Opener auto-detects when a gate is due based on the week number below.

### W2 Gate (Dashboard Core Complete) — Week 2 마지막 금요일
- [ ] 1,000-record data loading performance test (must be <3 seconds)
- [ ] Full CRUD scenario walkthrough with seed data
- [ ] Import pipeline E2E test
- [ ] Traffic Light engine unit test coverage
- [ ] All W2 completion criteria from spec verified

### W3 Milestone (Documentation & Process Maturity) — Week 3 마지막 금요일
- [ ] API Contract documentation (OpenAPI spec for complex endpoints: FIMS export, import, chat)
- [ ] Feature Flag strategy for FIMS integration and AI chatbot (gradual rollout plan)
- [ ] Third-party integration audit log (`docs/founder/dependencies.md`)
- [ ] Founder Mental Model Check #1 (PII flow + Traffic Light logic)

### W4 Gate (Security Audit) — Week 4 마지막 금요일
- [ ] OWASP Top 10 basic security checklist
- [ ] Full API route auth/RBAC matrix verification
- [ ] PII lifecycle audit (input → encryption → storage → decryption → masking → LLM)
- [ ] 위탁계약 7 mandatory clauses vs system implementation alignment check
- [ ] All W4 completion criteria from spec verified
- [ ] Runbook for top 3 failure scenarios (DB outage, import error, LLM API failure)
- [ ] Incident postmortem template created (`docs/founder/postmortem-template.md`)

### W6 Gate (Phase 1 Complete) — Week 6 마지막 금요일
- [ ] Phase 1 full KPI measurement
- [ ] Pilot onboarding simulation (full workflow with seed data)
- [ ] All Acceptance Criteria from spec v2.1 checked
- [ ] Performance benchmarks documented
- [ ] Phase 2 planning document drafted
- [ ] Internal wiki / knowledge base for pilot university onboarding
- [ ] Founder Mental Model Check #2 (full system walkthrough)

## Phase 1 Scope (W0–W6, 6 weeks)

1. Integrated student management dashboard
2. FIMS-compatible export + status change report workflow
3. AI multilingual chatbot (KO/EN/ZH/VI/UZ/MN)
4. Excel/CSV import + AI column mapping
5. Email / Kakao / SMS notifications
6. Data migration (from HireVisa / manual Excel)
7. Real-time IEQAS overstay rate monitoring
