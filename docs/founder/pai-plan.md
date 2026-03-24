# Gen's Personal AI Infrastructure (PAI) — 적용 계획

## 핵심 결정

- **환경**: Claude Code CLI (hooks 활용)
- **범위**: Gen 개인 전체 (프로젝트 3개 포괄)
- **목표**: 어떤 프로젝트에서 세션을 열든 "Gen이 누구인지 + 뭘 추구하는지 + 뭘 배웠는지" 자동 로드

---

## 1. 디렉토리 구조

```
~/.claude/                          ← Gen 개인 PAI (전 프로젝트 공통)
├── CLAUDE.md                       ← 자동 빌드 or 수동 조합 (hot cache)
├── CLAUDE.md.template              ← CLAUDE.md 생성 템플릿
│
├── USER/                           ← Gen의 정체성 (PAI 업그레이드 시 불변)
│   ├── ABOUTME.md                  ← 배경, 전문성
│   ├── AISTEERINGRULES.md          ← AI 행동 규칙 (advisor-only, 존댓말 등)
│   ├── WRITINGSTYLE.md             ← 글쓰기 톤/스타일
│   ├── OPINIONS.md                 ← 기술/사업 선호
│   ├── TELOS/
│   │   ├── MISSION.md              ← 내가 왜 이 일들을 하는지
│   │   ├── GOALS.md                ← 전체 목표 (프로젝트별 + 개인)
│   │   ├── PROJECTS.md             ← 프로젝트 레지스트리 (3개)
│   │   ├── BELIEFS.md              ← 핵심 신념
│   │   ├── STRATEGIES.md           ← 의사결정 프레임워크
│   │   ├── CHALLENGES.md           ← 현재 막혀있는 것들
│   │   ├── LEARNED.md              ← 교훈 (WISDOM에서 승격된 것들)
│   │   └── IDEAS.md                ← 아이디어 파킹
│   └── PROJECTS/                   ← 프로젝트별 설정
│       ├── visacampus.md           ← VC 요약 + 링크
│       ├── localnomad.md           ← LN 요약 + 링크
│       └── protoville.md           ← PV 요약 + 링크
│
├── MEMORY/                         ← 학습 기록 (전 프로젝트 공통)
│   ├── LEARNING/
│   │   ├── learnings.md            ← 배운 것 (append-only)
│   │   ├── failures.md             ← 실패 기록 (append-only)
│   │   └── synthesis.md            ← 주간 패턴 분석
│   ├── RELATIONSHIP/
│   │   └── people/                 ← 사람 프로필 (프로젝트 무관)
│   ├── STATE/
│   │   └── current-focus.md        ← 지금 뭐에 집중하는지
│   └── WISDOM/
│       └── principles.md           ← 3회 이상 검증된 원칙
│
├── SYSTEM/                         ← PAI 인프라 (업그레이드 시 교체)
│   └── VERSION.md
│
├── hooks/                          ← Claude Code lifecycle hooks
│   ├── session-start.sh            ← 세션 시작 시 컨텍스트 로드
│   ├── session-end.sh              ← 세션 종료 시 메모리 업데이트
│   └── rating-capture.sh           ← 👍/👎 시 학습 기록
│
└── settings.json                   ← 전역 보안 설정


~/projects/                         ← 각 프로젝트 (독립 repo)
├── localnomad-b2b/                 ← VisaCampus
│   └── .claude/
│       ├── CLAUDE.md               ← 프로젝트 전용 hot cache
│       ├── rules/                  ← 코딩 규칙, 보안, 마일스톤
│       └── memory/                 ← 프로젝트 진행 상태, 의사결정
├── localnomad-app/                 ← LocalNomad (가칭)
│   └── .claude/
│       ├── CLAUDE.md
│       ├── rules/
│       └── memory/
└── protoville/                     ← ProtoVille
    └── .claude/
        ├── CLAUDE.md
        ├── rules/
        └── memory/
```

### 멀티 프로젝트 통합 원리

```
세션 열림 (예: localnomad-b2b/)
    ↓
~/.claude/CLAUDE.md 로드 (Gen 개인 컨텍스트)
    +
./localnomad-b2b/.claude/CLAUDE.md 로드 (프로젝트 컨텍스트)
    ↓
AI는 "Gen이 누구인지" + "이 프로젝트의 규칙" 둘 다 안다
```

Claude Code는 `~/.claude/CLAUDE.md` (글로벌)과 `프로젝트/.claude/CLAUDE.md` (로컬)을
자동으로 둘 다 읽습니다. 별도 설정 불필요.

### 무엇이 어디에 속하는가

| 내용 | 위치 | 이유 |
|------|------|------|
| "Agent = advisor, not decision-maker" | `~/.claude/USER/AISTEERINGRULES.md` | Gen의 모든 AI 상호작용에 적용 |
| "PII는 AES-256-GCM 암호화" | `프로젝트/.claude/rules/` | VisaCampus 전용 보안 규칙 |
| "존댓말 사용" | `~/.claude/USER/AISTEERINGRULES.md` | 전 프로젝트 공통 |
| "indigo-600 primary color" | `프로젝트/.claude/rules/` | VisaCampus 전용 스타일 |
| "chunked createMany가 bulk보다 낫다" | `~/.claude/MEMORY/LEARNING/` | 프로젝트 횡단 기술 인사이트 |
| "Asan cluster = 3개 대학" | `프로젝트/.claude/memory/glossary.md` | VisaCampus 전용 용어 |
| "1인 파운더는 AI 없이 B2B SaaS 못 만든다" | `~/.claude/USER/TELOS/BELIEFS.md` | Gen의 핵심 신념 |

---

## 2. TELOS 초안

### MISSION.md

```markdown
# Mission

외국인이 한국/일본/대만에서 살고 일하는 과정의 마찰을 없앤다.
비자, 체류, 정착 — 지금은 수작업과 불안의 영역인 것을 시스템으로 바꾼다.

대학 국제처 담당자가 Excel 3개와 FIMS를 번갈아 보는 대신 대시보드 하나로 일하고,
개인이 비자 상태를 실시간으로 추적하고,
시골에서도 새로운 형태의 커뮤니티가 작동할 수 있다는 걸 증명한다.

AI 에이전트를 극한까지 활용해서, 1인이 팀의 output을 낸다.
```

### GOALS.md

```markdown
# Goals

## 2026 H1 — 증명의 시기

### VisaCampus (최우선)
- Phase 1 완료: FIMS export, 알림, 데이터 마이그레이션
- Asan cluster 3개 대학 파일럿 시작
- 정기보고 시간 50% 단축 데이터 확보
- 첫 유료 전환

### LocalNomad
- [Gen이 현재 상태/목표 채워야 함]

### ProtoVille
- [Gen이 현재 상태/목표 채워야 함]

### 개인
- PAI 시스템 구축 → 프로젝트 전환 시 컨텍스트 손실 0
- AI agent 워크플로우 체계화 (재현 가능한 패턴)

## 2026 H2 — 확장

### VisaCampus
- 10개 대학 유료 전환
- MRR ₩5M
- Phase 2 기능 (실시간 FIMS 연동, 이민법 챗봇)

### LocalNomad
- [TBD]

### ProtoVille
- [TBD]
```

### PROJECTS.md

```markdown
# Active Projects

## VisaCampus
- **What**: 한국 대학 국제처용 유학생 관리 B2B SaaS
- **Repo**: localnomad-b2b
- **Landing**: visacampus.org
- **Phase**: Phase 1 (W0-W6), 파일럿 준비 중
- **Priority**: ★★★ 최우선
- **Stack**: Next.js 14, Prisma, PostgreSQL, Claude API

## LocalNomad
- **What**: 한/일/대만 비자 대시보드 + 리로케이션 서비스
- **Repo**: [TBD]
- **Phase**: [Gen이 채울 것]
- **Priority**: [Gen이 결정]
- **Stack**: [TBD]

## ProtoVille
- **What**: 시골 팝업 마을 프로젝트
- **Repo**: [TBD]
- **Phase**: [Gen이 채울 것]
- **Priority**: [Gen이 결정]
- **Stack**: [TBD]
```

### BELIEFS.md

```markdown
# Beliefs

## 사업
- 1인 파운더는 AI 에이전트 없이는 B2B SaaS를 만들 수 없다
- 파일럿 전에 가격을 확정하면 안 된다
- 대학은 보수적이다 — 신뢰 먼저, 기능 그다음
- "도구 제공"이지 "위탁"이 아니다 (법적 포지셔닝)
- 콜드 이메일은 짧을수록 좋다

## 기술
- PII는 절대 외부 API에 raw로 보내면 안 된다
- 스펙에 없는 건 만들지 않는다
- 기술 부채 3개 이상이면 기능 개발을 멈춰야 한다
- 테스트가 깨지면 새 기능을 시작하면 안 된다

## AI / 에이전트
- Agent = advisor, never decision-maker
- CLAUDE.md는 200줄 이하여야 한다
- 메모리 파일은 영어로 써야 한다 (크로스세션 효율)
- 에이전트에게 "추천하지 말고 옵션을 보여달라"고 해야 한다
- Context engineering이 프롬프트 엔지니어링보다 중요하다

## 삶
- [Gen이 추가할 것]
```

### STRATEGIES.md

```markdown
# Strategies

## 의사결정 프레임워크
- 모든 아키텍처/스키마/API/UX 결정은 내가 한다
- AI에게 2-3개 옵션 + 트레이드오프를 요구한다
- 결정은 항상 로그에 남긴다 (되돌릴 수 있게)

## GTM (VisaCampus)
- 파일럿 → 유료 전환 → 확장 (점진적)
- CTA: "15분 데모 신청" (낮은 진입장벽)
- 타겟: A-grade 대학 59개 → B-grade 65개
- 채널: 콜드 이메일 → 데모 → 파일럿

## 리소스 배분
- VisaCampus에 80% 시간 (현재 최우선)
- 나머지 프로젝트는 [Gen이 결정]
- AI 에이전트로 4-5x 생산성 → 실질적 1인 = 4-5인 팀

## 기술 전략
- AWS Seoul Region 고정 (데이터 주권)
- 외부 의존성 최소화
- Feature flag로 점진 롤아웃
```

### CHALLENGES.md

```markdown
# Current Challenges

## VisaCampus
- FIMS에 공개 API 없음 → Excel export로 우회 중
- 파일럿 대학 3곳 미확정 → 콜드 이메일 진행 중 (69/124 이메일 확보)
- 1인이라 QA/테스트 커버리지 부족
- 대학 의사결정 사이클이 길다 (학기 단위)
- 단체접수/정기보고 실제 데이터로 테스트 못 해봄

## LocalNomad
- [Gen이 채울 것]

## ProtoVille
- [Gen이 채울 것]

## 개인
- 프로젝트 3개 사이 컨텍스트 스위칭 비용
- AI 에이전트 세션 간 학습 연속성 부족 → PAI로 해결 시도 중
```

### LEARNED.md

```markdown
# Lessons Learned

## AI / 에이전트
- CLAUDE.md 200줄 넘으면 에이전트 컨텍스트 효율 급락
- rules/ (안정) vs memory/ (동적) 분리가 메모리 관리 핵심
- 에이전트한테 "추천하지 말라"고 명시하지 않으면 독단적으로 결정함
- 세션 wrap을 매번 시키지 않으면 크로스세션 학습이 0에 수렴

## 기술
- chunked createMany (CHUNK_SIZE=50) > single bulk for Prisma import
- lazy fetch + polling > eager load for dashboard notifications
- pre-commit hook으로 시크릿 스캔 (13 패턴) — 초기에 넣어야 함

## 영업 / GTM
- "15분 데모" CTA > "8주 파일럿" (진입장벽 낮음)
- 대학 이메일은 입학처/대학원/어학원이 아닌 국제처 직통을 찾아야 함
- 상황 묘사형 카피 > 기능 나열형 ("엑셀 3개 열던 업무" > "통합 대시보드")
- 124개 대학 중 올바른 이메일 55% 수준 — 수동 검증 필수

## 사업
- Trust section은 파일럿 전에는 넣지 말 것 (보여줄 게 없음)
- 가격은 "학생 수 기반, 상세는 도입 문의 시"로 — 확정 전 공개 금지
```

### IDEAS.md

```markdown
# Ideas

(파킹 공간 — 검증 안 된 생각들. 정기적으로 리뷰해서 GOALS로 승격하거나 삭제)

- [Gen이 추가할 것]
```

---

## 3. Hooks 설계 (CLI용)

### session-start

```
트리거: 세션 시작
동작:
  1. ~/.claude/MEMORY/STATE/current-focus.md 읽기 → "지금 뭐에 집중?"
  2. TELOS/GOALS.md에서 현재 분기 목표 확인
  3. TELOS/CHALLENGES.md에서 활성 블로커 체크
  4. 프로젝트별 .claude/에서 Emergency Brake 체크
  5. MEMORY/LEARNING/failures.md 최근 3개 → "반복하지 말 것"
출력: 세션 상태 위젯 (현재 VisaCampus의 Session Opener 확장판)
```

### session-end

```
트리거: 세션 종료
동작:
  1. MEMORY/LEARNING/learnings.md에 이번 세션 인사이트 추가
  2. MEMORY/LEARNING/failures.md에 실패 있었으면 추가
  3. MEMORY/STATE/current-focus.md 업데이트
  4. TELOS/CHALLENGES.md 업데이트 (해결된 거 있으면)
  5. 프로젝트별 .claude/memory/ 업데이트 (기존 session wrap)
```

### rating-capture

```
트리거: 유저가 👍/👎 평가
동작:
  👎 → MEMORY/LEARNING/failures.md에 맥락 + 원인 기록
  👍 → MEMORY/LEARNING/learnings.md에 "이게 잘 작동했다" 기록
```

---

## 4. 마이그레이션 체크리스트

### Phase A: PAI 구조 생성 (지금)
- [ ] `~/.claude/USER/TELOS/` 디렉토리 + 초안 파일 생성
- [ ] `~/.claude/USER/ABOUTME.md` ← gen.md 내용 이동
- [ ] `~/.claude/USER/AISTEERINGRULES.md` ← decision-making.md에서 개인 규칙 추출
- [ ] `~/.claude/MEMORY/` 구조 생성
- [ ] `~/.claude/CLAUDE.md` 작성 (TELOS + STEERING 참조)

### Phase B: 기존 VisaCampus .claude/ 정리
- [ ] `rules/02-decision-making.md`에서 개인 규칙 제거 (글로벌로 이동됨)
- [ ] `memory/people/gen.md` → ABOUTME.md 참조로 대체
- [ ] 프로젝트 CLAUDE.md에서 개인 규칙 제거, 프로젝트 전용만 남기기
- [ ] 글로벌 glossary 항목 분리 (프로젝트 무관 용어 → USER/)

### Phase C: Hooks 설정 (CLI 전환 후)
- [ ] session-start hook 작성
- [ ] session-end hook 작성
- [ ] 테스트: VisaCampus 세션에서 글로벌 + 로컬 CLAUDE.md 둘 다 로드되는지 확인

### Phase D: 다른 프로젝트 온보딩
- [ ] LocalNomad repo에 `.claude/` 구조 생성
- [ ] ProtoVille repo에 `.claude/` 구조 생성
- [ ] TELOS/PROJECTS.md + GOALS.md 나머지 채우기
- [ ] 크로스 프로젝트 세션 전환 테스트

---

## 5. 글로벌 CLAUDE.md 초안

```markdown
# Gen's AI Infrastructure

I am Gen (Seungeun Lee), solo founder running 3 projects with heavy AI agent usage.

## Identity
- Read: `~/.claude/USER/ABOUTME.md`
- Read: `~/.claude/USER/AISTEERINGRULES.md`

## Purpose (TELOS)
- Mission: Eliminate friction for foreigners living/working in KR/JP/TW
- Current focus: `~/.claude/MEMORY/STATE/current-focus.md`
- Goals: `~/.claude/USER/TELOS/GOALS.md`

## Core Rules (all projects)
1. Agent = advisor, not decision-maker. Present 2-3 options with trade-offs.
2. Korean (존댓말) for conversation. English for code/docs/memory.
3. Ask ≥1 clarifying question per task. Front-load all questions.
4. Never add features/deps beyond the prompt.
5. Log every decision.
6. Be brutal in feedback. Look for blind spots.

## Memory
- Learnings: `~/.claude/MEMORY/LEARNING/`
- Wisdom: `~/.claude/MEMORY/WISDOM/`
- Recent failures: check before starting work

## Lookup Flow
1. This file (hot cache)
2. TELOS/ (purpose & direction)
3. Project .claude/ (project-specific rules)
4. MEMORY/ (learnings, failures, people)
5. Ask Gen
```
