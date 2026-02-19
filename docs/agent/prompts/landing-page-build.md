# Landing Page Build Prompt — VisaCampus

## Context

You are building the public landing page for **VisaCampus**, a B2B platform for Korean university international affairs offices to manage foreign student visas. This is a **lead generation page** — visitors should feel "this is exactly what I need" and submit a free pilot request.

**Deployment**: `visacampus.org` via Vercel
**Repo**: `visacampus-landing/` (separate from the main app)
**Dashboard app**: `app.visacampus.org` (separate repo `localnomad-b2b/`)

## Reference Files

- **Wireframe**: `visacampus-landing/wireframe.jsx` — React + Tailwind wireframe with all copy, sections, and component structure finalized
- **Spec**: `docs/founder/랜딩페이지-기획안.md` — Full spec with section details, design notes, and feature status table

**The wireframe is the source of truth for all copy and layout.** Do not change any text, section order, or feature status markers without explicit instruction.

## Task

Convert the wireframe into a production-ready, deployable landing page.

### Project Setup

Initialize a **Next.js 14 (App Router)** project inside `visacampus-landing/`:
- TypeScript + Tailwind CSS
- Single page (`src/app/page.tsx`) — no routing needed
- Static export (`output: 'export'` in next.config) for Vercel static hosting
- No backend, no API routes, no database

### Tech Requirements

- **Mobile-first responsive** — must look great on 360px (mobile) through 1440px+ (desktop)
- **Windows optimized** — font stack: `'Pretendard', 'Segoe UI', -apple-system, sans-serif`
- **Chrome / Edge optimized** — test with these browsers in mind
- **Font**: Load Pretendard via CDN (`@import` or `<link>`)
- **Performance**: Lighthouse 90+ on all metrics. Lazy load images, minimal JS.
- **SEO**: Proper meta tags, Open Graph, Korean lang attribute
- **Favicon**: Simple indigo "VC" logo (generate as SVG)

### Design System

- **Primary**: indigo-600 (`#4F46E5`)
- **Accent**: emerald-500
- **Danger**: red-500
- **Text**: gray-900 (headings), gray-600 (body), gray-400 (coming soon items)
- **Coming Soon badge**: amber-50 bg, amber-700 text, amber-200 border, rounded-full
- **No ReadyBadge** — implemented features have no special marker
- **Coming Soon items**: lighter text color (text-gray-400), no clock emoji. Positioned after ready items within each section.
- **Border radius**: xl for cards, 2xl for form container
- **Shadow**: shadow-lg shadow-indigo-200 for primary CTA

### Sections (6 total, in order)

Follow the wireframe exactly. Here is the section summary:

1. **Nav** — Fixed top, VC logo + "무료 파일럿 신청" button
2. **Hero** — Headline: "유학생 비자 관리, 엑셀에서 벗어나세요". Sub: "FIMS 보고부터 비자 만료 관리까지, 한 곳에서." 3 feature pills. CTA: "8주 무료 파일럿 신청". Sub-CTA: "설치 없이 바로 시작 · 8주간 무료"
3. **Problem** — "이런 고민, 매 학기 반복되고 계시죠?" 4 pain point cards. No subtitle. IEQAS card has red border.
4. **Solution** — "VisaCampus가 도와드립니다". 3 features with alternating image layout. Feature 1 (Dashboard) = no badge. Feature 2 (FIMS) = ComingSoonBadge. Feature 3 (AI Chatbot) = ComingSoonBadge. Within Feature 2: ready sub-items first (with CheckIcon), coming soon sub-items after (lighter text, "(출시 예정)" label). Feature 3: all items in lighter text.
5. **Before/After** — "이렇게 달라집니다". No subtitle. Left-right split cards (Before=red bg / After=green bg). Ready items first (full opacity), Coming Soon items after (opacity-80, lighter colors, ComingSoonBadge in After column). Mobile: top-bottom split.
6. **Trust** — "개인정보, 안심하세요". 2 cards (개인정보 보호, 역할별 접근 권한). Below cards: data export guarantee box ("무료 체험이 끝나도 데이터는 언제든 내보낼 수 있습니다.")
7. **CTA Form** — "8주 무료 파일럿을 시작하세요". 3 fields: 이메일, 소속, 담당 업무. Submit: "8주 무료 파일럿 신청하기". Privacy note: "🔒 입력하신 정보는 파일럿 안내 목적으로만 사용됩니다." Success state with ✅.
8. **Footer** — VC logo, "대학 국제처를 위한 유학생 관리 플랫폼", contact@visacampus.org

### Form Handling

For now, the form submit should:
1. Show the success state (client-side only)
2. TODO comment for future: connect to email service (Resend, SendGrid, or Vercel serverless function)

Do NOT implement actual email sending yet.

### Screenshot Placeholders

The wireframe has 3 placeholder boxes for screenshots:
- `[대시보드 스크린샷]`
- `[Import 화면 스크린샷]`
- `[챗봇 목업 이미지]`

Keep these as styled placeholder divs with dashed borders. We will add real screenshots later.

### What NOT to Do

- Do NOT add features, sections, or text not in the wireframe
- Do NOT use "SaaS" anywhere — use "유학생 관리 플랫폼"
- Do NOT add percentages or inflated numbers (no "90% automation" etc.)
- Do NOT add pricing section
- Do NOT add pilot university names
- Do NOT add legal claims ("행정사법", "법적 안정성")
- Do NOT add a ReadyBadge or "사용 가능" marker — only mark "출시 예정"
- Do NOT use clock emoji for coming soon items

### File Budget

Maximum **8 new files** (excluding node_modules, .next, etc.):
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx` (main landing page)
- `src/app/globals.css`
- `public/favicon.svg`

Keep it simple. Single page, minimal files. Use your design/React skills to make it polished and professional.

### Success Criteria

1. `npm run build` completes with 0 errors
2. Page renders correctly at 360px, 768px, 1280px, 1440px widths
3. All Korean text is correctly displayed (no broken encoding)
4. All CTAs link to `#cta` section
5. Form shows success state on submit
6. No console errors in Chrome/Edge
7. Lighthouse Performance 90+, Accessibility 90+
