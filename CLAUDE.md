# VisaCampus

> Personal rules (advisor-only, decision logging, clarification protocol) are in global `~/.claude/CLAUDE.md`.
> This file contains **project-specific context only**.

## Quick Reference

- **Product**: VisaCampus (B2B SaaS for university international offices)
- **Landing**: visacampus.org
- **Target**: Korean university international affairs offices
- **Pilot**: 3 universities in Asan cluster (Hoseo, Sunmoon, Soonchunhyang)
- **Spec**: `docs/founder/spec/Phase1_프로덕트_스펙_v2.1.md`

## Context Files

Read the relevant files when needed — do NOT load all files at session start.

### Rules (stable):
- `.claude/rules/01-coding-conventions.md` — TypeScript, styling, API, security
- `.claude/rules/02-decision-making.md` — Must-ask vs auto-decide boundaries
- `.claude/rules/03-verification.md` — UX, security, spec compliance checklists
- `.claude/rules/04-weekly-milestones.md` — Weekly items + W2/W3/W4/W6 gates + session opener


### Memory (dynamic):
- `memory/glossary.md` — Domain acronyms, terms, shorthand
- `memory/decisions.md` — Project decisions with reasoning
- Session wrap → global `~/.claude/CLAUDE.md` procedure

### Session Start Fallback
If SessionStart hook did not inject context, read these at session start:
- `memory/decisions.md`
- `memory/glossary.md`

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **State**: Zustand | **Table**: TanStack Table
- **Backend**: Next.js API Routes (REST) | **ORM**: Prisma | **DB**: PostgreSQL 16
- **AI/LLM**: Claude API — Haiku (intent) + Sonnet (response) | **RAG**: LangChain + Pinecone
- **Auth**: NextAuth.js + JWT | **Notifications**: Kakao BizMessage + AWS SES + SMS
- **Test**: Vitest + Playwright | **Deploy**: AWS Seoul Region
- **Other**: date-fns, SheetJS, Redis (late Phase 1), Sentry + CloudWatch

## Project Structure

```
localnomad-b2b/
├── prisma/              # Schema + migrations
├── src/
│   ├── app/
│   │   ├── (auth)/      # Login
│   │   ├── (dashboard)/ # Main dashboard (students, calendar, fims, import, alerts, settings)
│   │   └── api/         # API Routes
│   ├── components/      # layout, students, dashboard, ui (shadcn)
│   ├── lib/             # prisma, auth, crypto, utils
│   ├── store/           # Zustand stores
│   └── types/           # Type definitions
├── docs/
│   ├── founder/         # Gen reads (Korean): spec, research, checklists, decision log, tech debt
│   ├── agent/           # Agent reads (English): reference (architecture-map, pii-data-flow)
│   └── _archive/        # Obsolete (do not reference)
└── .claude/
    ├── rules/           # Stable rules (5 files)
    ├── memory/          # Dynamic state (glossary, projects/, context/)
    └── settings.local.json  # Security deny list (84 rules)
```

## Domain Glossary

| Term | Description |
|------|-------------|
| FIMS | Foreign Student Information Management System. No public API. |
| IEQAS | International Education Quality Assurance. Overstay rate: Basic <2%, Excellent <1%. |
| 변동신고 | Status change report — must report to FIMS within 15 days. |
| 정기보고 | Quarterly FIMS report (Feb/May/Aug/Nov). |
| Traffic Light | GREEN (normal) → YELLOW (caution) → RED (critical). |
| 단체접수 | Batch visa extension (50-80 cases per semester). |
| 신원보증 | University president as legal guarantor (Immigration Act Art. 90, 4-year limit). |

## Dev Commands

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema (dev)
npx prisma migrate dev   # Create migration
npx prisma studio        # DB GUI
```

## Security (project-specific)

- PII encrypted (AES-256-GCM), never sent raw to any external API
- Every API route: `universityId` filter (no cross-tenant) + RBAC check
- All deletes are soft delete
- Decision log: `docs/founder/의사결정-일지.md` + `memory/decisions.md`

## Phase 1 Scope (W0–W6)

1. Integrated student management dashboard
2. FIMS-compatible export + status change workflow
3. AI multilingual chatbot (KO/EN/ZH/VI/UZ/MN)
4. Excel/CSV import + AI column mapping
5. Email / Kakao / SMS notifications
6. Data migration (HireVisa / Excel)
7. Real-time IEQAS overstay rate monitoring
