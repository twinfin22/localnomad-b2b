# Prompt Template Library (프롬프트 템플릿 라이브러리)

> **목적**: Claude Code에게 일을 시킬 때 일관된 품질을 보장하는 프롬프트 구조를 정의합니다.
> **사용법**: Gen이 뼈대를 잡고, Cowork이 해당 템플릿에 맞춰 살을 붙입니다.
> **마지막 업데이트**: W2 D7

---

## Template 1: New Feature (신규 기능 구현)

Day 1-7에서 검증된 구조입니다. 이 순서로 프롬프트를 작성하면 Claude Code가 가장 일관된 결과를 냅니다.

```markdown
# LocalNomad B2B Visa Dashboard — Day N: [기능명]

> **Prerequisites**: Day 1-[N-1] complete. [이전에 완료된 것 요약].
> **Today's Goal**: [오늘 만들 것 한 문장].
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` ([해당 섹션]) first.
> **CRITICAL**: [보안/법적 주의사항이 있으면 여기에].

---

## ⚠️ Decision-Making Rules (Must Follow)
[CLAUDE.md의 Decision-Making Rules 복사 — 매 프롬프트에 반복]

---

## Task 0: Carry-Over Fixes (이월 버그 수정)
[이전 Day에서 미해결된 버그가 있으면 여기에. 없으면 Task 0 생략]

구체적인 코드 위치와 수정 방법을 명시합니다:
- 파일: `src/app/api/[경로]/route.ts`
- 현재 문제: [무엇이 잘못되어 있는지]
- 수정 방법: [어떻게 고쳐야 하는지]

## Task 1: [태스크 제목]

### 1-1. [서브태스크]
[구체적인 구현 지시]

### 1-2. [서브태스크]
[구체적인 구현 지시]

### Acceptance Criteria:
- [ ] [검증 가능한 기준 1]
- [ ] [검증 가능한 기준 2]

---

## Task N: Verification Checklist
[매 프롬프트의 마지막 Task는 항상 검증]

### Build
- [ ] `npm run build` — 0 errors
- [ ] No TypeScript `any` types

### Security
- [ ] RBAC enforced
- [ ] universityId scoping
- [ ] PII handling correct

### Korean UI
- [ ] All user-facing text in Korean

---

## Summary Table
| Task | Description | Key Files |
|------|-------------|-----------|
| 0 | Carry-over fixes | [파일 목록] |
| 1 | [태스크] | [파일 목록] |
```

### 이 템플릿이 효과적인 이유:
- **Prerequisites**: Claude Code가 현재 상태를 파악
- **Decision-Making Rules 반복**: 긴 작업 중 규칙을 잊지 않음
- **Task 0 (이월 버그)**: 이전 Day의 미해결 문제가 묻히지 않음
- **Acceptance Criteria per Task**: 각 태스크별 통과 기준 명확
- **Summary Table**: Claude Code가 작업 범위를 한눈에 파악

---

## Template 2: Bug Fix (버그 수정)

```markdown
# Bug Fix: [버그 제목]

## 현재 상태
- **파일**: `src/[경로]`
- **증상**: [사용자에게 어떻게 보이는지]
- **원인**: [왜 이런 일이 발생하는지]

## 수정 방법
1. `src/[파일]` 에서 [무엇]을 [어떻게] 변경
2. [추가 변경 사항]

## 수정 후 확인
- [ ] [증상이 해소되었는지 확인 방법]
- [ ] 기존 테스트 통과 (`npm run test`)
- [ ] 관련 기능에 부작용 없음

## 영향 범위
- 수정되는 파일: [목록]
- 영향받을 수 있는 기능: [목록]
```

### 교훈 (Day 3-4 RBAC 버그에서 배운 것):
- 버그 수정 지시는 **구체적인 코드 위치와 수정 코드 예시**를 포함해야 함
- "RBAC을 추가하세요" 같은 추상적 지시는 3번 이월됨
- "src/app/api/dashboard/summary/route.ts 의 12번째 줄에 withRbac(session, 'student', 'read') 를 추가하세요" 수준으로 구체적이어야 함

---

## Template 3: DB Schema Change (스키마 변경)

```markdown
# Schema Change: [변경 제목]

## ⚠️ Gen 승인 필요
DB 스키마 변경은 반드시 Gen의 사전 승인이 필요합니다.

## 변경 내용
### 새 필드 추가:
```prisma
model [모델명] {
  // 기존 필드들...
  [새필드] [타입] [제약조건]  // [이 필드가 필요한 이유]
}
```

### 새 Enum 추가 (해당 시):
```prisma
enum [이름] {
  VALUE_1  // 설명
  VALUE_2  // 설명
}
```

## 영향 분석
- 이 변경으로 수정해야 하는 API: [목록]
- 이 변경으로 수정해야 하는 컴포넌트: [목록]
- 기존 데이터 마이그레이션 필요 여부: [예/아니오]

## 실행
```bash
npx prisma db push    # 개발 DB에 즉시 반영
npx prisma generate   # Prisma 클라이언트 재생성
```

## 롤백 계획
[문제가 생기면 어떻게 되돌리는지]
```

---

## Template 4: Verification Review (검증 요청)

Gen이 "Day N 끝났어 확인해줘"라고 했을 때 Cowork이 수행하는 검증 구조입니다.

```markdown
# Day N 검증 보고서

## 빌드 상태
- npm run build: [결과]
- npm run test: [통과/실패 수]
- TypeScript any 타입: [있음/없음]

## 태스크별 검증
### Task 1: [태스크명]
- Acceptance Criteria 1: [통과/불통과] — [근거]
- Acceptance Criteria 2: [통과/불통과] — [근거]

## 보안 검증
- RBAC: [모든 API에 적용되었는가]
- PII: [암호화/마스킹 정상 동작하는가]
- universityId 필터링: [모든 쿼리에 적용되었는가]

## 한국어 UI 검증
- [영어 노출 없음 / 발견된 문제]

## 새로 발생한 기술 부채
- [있으면 목록 / 없으면 "없음"]

## 실행 흐름 설명
[새 기능이 어떻게 동작하는지, 비개발자가 이해할 수 있는 수준으로]
```

---

## Anti-Patterns (하지 말아야 할 것)

Day 1-7에서 발견된 비효과적인 프롬프트 패턴:

| 비효과적 | 효과적 | 이유 |
|----------|--------|------|
| "RBAC을 추가하세요" | "src/app/api/dashboard/summary/route.ts 에 withRbac() 추가" | 추상적 지시 → 3번 이월 |
| 6개 이상 태스크를 한 프롬프트에 | 최대 5개, 초과 시 분할 | 컨텍스트 윈도우 한계 |
| 버그 수정을 다음 Day로 이월 | Task 0에 구체적 코드와 함께 포함 | 이월될수록 수정 확률 하락 |
| "적절히 처리하세요" | 구체적 입출력 명시 | Claude Code는 "적절히"를 다르게 해석 |
| Decision Rules를 생략 | 매 프롬프트에 반복 | 긴 작업에서 규칙을 잊음 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| W2 D7 | 초기 작성 (Day 1-7 경험 기반) |
