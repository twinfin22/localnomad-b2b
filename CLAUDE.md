# LocalNomad B2B Visa Dashboard

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
- **AI/LLM**: Claude API (Anthropic)
- **RAG**: LangChain + Pinecone
- **Notifications**: Kakao BizMessage API + AWS SES + SMS
- **Auth**: NextAuth.js + JWT (Credentials Provider, university email login)
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
| Traffic Light | Student status visualization — GREEN (normal), YELLOW (caution), ORANGE (warning), RED (critical) |
| 단체접수 (Batch Visa) | Bulk visa extension processing (50-80 cases per semester start) |
| 신원보증 (Guarantor) | Immigration Act Article 90 — university president is legal guarantor for foreign students (4-year limit) |

## File Management Rules

- All `.md` documentation files go in `docs/` folder (except this CLAUDE.md)
- Latest spec: `docs/Phase1_프로덕트_스펙_v2.1.md`
- Research files: `docs/*_research.md`
- Claude Code prompts: `docs/claude-code-day*.md`

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
- Deviating from the spec (`docs/Phase1_프로덕트_스펙_v2.1.md`)
- Removing or skipping features listed in the spec
- Changing API response format or endpoint structure
- Pricing, billing, or payment-related decisions
- Anything that could create legal/compliance risk (data residency, PII exposure, guarantor liability)

When blocked, document the question clearly and move on to the next independent task.

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
- [ ] Features match the acceptance criteria in `docs/Phase1_프로덕트_스펙_v2.1.md`
- [ ] No features added that are not in Phase 1 scope (avoid scope creep)

If any item fails, fix it before marking the task as complete.

## Weekly Checkpoints (Cowork Agent Responsibility)

At the end of each week (W1, W2, ...), a deeper review is triggered by the Cowork agent (PM/Architect).
**If the founder forgets to request a weekly review, the Cowork agent should proactively nudge.**

### Product Strategy Alignment
- Compare implemented features against the week's completion criteria in `docs/Phase1_프로덕트_스펙_v2.1.md`
- Check every Acceptance Criteria item for the completed features
- Verify Traffic Light logic matches spec's status engine definition
- Verify IEQAS overstay rate calculation accuracy
- Flag any deviation from spec or scope creep

### UX Review (Persona P1: 김현정 — university staff perspective)
- Walk through the primary user workflow with seed data
- Check Korean UI consistency, typos, unnatural phrasing
- Verify desktop layout (1280px+) has no overflow or broken alignment
- Confirm error states show user-friendly Korean messages

### Legal & Security Audit
- Trace PII flow end-to-end: input → encrypt → store → decrypt → mask → LLM
- Verify no code path sends raw PII to Claude API
- Confirm AuditLog records exist for all PII access
- Check "도구 제공" positioning is maintained (no features that could be interpreted as 행정사 업무 자동화)
- Verify soft delete is used everywhere (no hard DELETE queries)
- Cross-tenant isolation: every query scoped to universityId

## Milestone Gates

Critical go/no-go checkpoints at major transitions. These are deeper than weekly reviews.

### W2 Gate (Dashboard Core Complete)
- [ ] 1,000-record data loading performance test (must be <3 seconds)
- [ ] Full CRUD scenario walkthrough with seed data
- [ ] Import pipeline E2E test
- [ ] Traffic Light engine unit test coverage
- [ ] All W2 completion criteria from spec verified

### W4 Gate (Security Audit)
- [ ] OWASP Top 10 basic security checklist
- [ ] Full API route auth/RBAC matrix verification
- [ ] PII lifecycle audit (input → encryption → storage → decryption → masking → LLM)
- [ ] 위탁계약 7 mandatory clauses vs system implementation alignment check
- [ ] All W4 completion criteria from spec verified

### W6 Gate (Phase 1 Complete)
- [ ] Phase 1 full KPI measurement
- [ ] Pilot onboarding simulation (full workflow with seed data)
- [ ] All Acceptance Criteria from spec v2.1 checked
- [ ] Performance benchmarks documented
- [ ] Phase 2 planning document drafted

## Phase 1 Scope (W0–W6, 6 weeks)

1. Integrated student management dashboard
2. FIMS-compatible export + status change report workflow
3. AI multilingual chatbot (KO/EN/ZH/VI/UZ/MN)
4. Excel/CSV import + AI column mapping
5. Email / Kakao / SMS notifications
6. Data migration (from HireVisa / manual Excel)
7. Real-time IEQAS overstay rate monitoring
