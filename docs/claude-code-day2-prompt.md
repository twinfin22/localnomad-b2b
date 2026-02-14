# 로컬노마드 B2B 비자 대시보드 — Day 2: API CRUD + RBAC + Seed Data

> **전제**: Day 1에서 프로젝트 초기화, Prisma 스키마, 인증 모듈, 기본 레이아웃 UI가 완성되었습니다.
> **오늘 목표**: 백엔드 API CRUD + RBAC 미들웨어 + 개발용 시드 데이터를 완성합니다.
> **참고**: `CLAUDE.md`와 `docs/Phase1_프로덕트_스펙_v2.1.md`를 반드시 읽고 컨벤션을 따라주세요.

---

## ⚠️ Decision-Making Rules (반드시 준수)

이 프롬프트를 실행하는 동안 창업자가 부재할 수 있습니다. 아래 규칙을 따르세요:

### 알아서 결정해도 되는 것:
- 라이브러리 버전 선택, import 순서, 코드 포맷팅
- 파일/폴더 네이밍 (기존 컨벤션 범위 내)
- 에러 메시지 문구 (반드시 한글, 사용자 친화적으로)
- Mock/Seed 데이터 구체 내용 (국적별 이름, 주소 등)
- 빌드 에러, lint 에러 수정
- UI 간격, 패딩 등 디자인 시스템 내 미세 조정

### 반드시 멈추고 기다려야 하는 것 (절대 임의로 진행하지 마세요):
- 새로운 패키지/의존성 추가 (tech stack에 없는 것)
- DB 스키마 변경 (테이블/컬럼 추가·삭제·이름변경)
- 인증/인가 로직 변경
- 암호화 또는 PII 처리 방식 변경
- 스펙(`docs/Phase1_프로덕트_스펙_v2.1.md`)에서 벗어나는 구현
- API 응답 형식 또는 엔드포인트 구조 변경
- 법적/컴플라이언스 리스크가 있는 모든 것

블록되면 → 질문을 명확히 남기고 → 다음 독립적인 Task로 넘어가세요.

---

## Task 1: RBAC 미들웨어

`src/lib/rbac.ts` 파일을 생성하세요.

역할별 권한 매트릭스:

| 리소스 | ADMIN | MANAGER | VIEWER |
|--------|-------|---------|--------|
| 학생 조회 | ✅ | ✅ | ✅ |
| 학생 생성/수정 | ✅ | ✅ | ❌ |
| 학생 삭제 | ✅ | ❌ | ❌ |
| PII 복호화 조회 (여권번호, ARC) | ✅ | ✅ | ❌ |
| 사용자 관리 | ✅ | ❌ | ❌ |
| 설정 변경 | ✅ | ❌ | ❌ |
| 알림 조회 | ✅ | ✅ | ✅ |
| FIMS 내보내기 | ✅ | ✅ | ❌ |
| 임포트 | ✅ | ✅ | ❌ |
| AuditLog 조회 | ✅ | ❌ | ❌ |

구현 요구사항:
- `checkPermission(role: UserRole, resource: string, action: string): boolean` 함수
- API Route에서 사용할 `withAuth` 또는 `requireRole` 헬퍼 함수
- 권한 없을 때 HTTP 403 반환: `{ success: false, error: "권한이 없습니다." }`
- NextAuth 세션에서 role과 universityId를 가져와서 검증

---

## Task 2: AuditLog 유틸리티

`src/lib/audit.ts` 파일을 생성하세요.

PII(고유식별정보) 접근 시 자동으로 로그를 기록하는 유틸리티입니다.

```typescript
// 사용 예시
await createAuditLog({
  userId: session.user.id,
  action: 'READ',           // CREATE | READ | UPDATE | DELETE | EXPORT | LOGIN
  resource: 'STUDENT',      // STUDENT | FIMS_REPORT | USER | etc.
  resourceId: studentId,
  details: { fields: ['passportNumber', 'arcNumber'] },  // 접근한 PII 필드
  ipAddress: request.headers.get('x-forwarded-for'),
})
```

---

## Task 3: Students API CRUD

`src/app/api/students/route.ts` — GET (목록), POST (생성)
`src/app/api/students/[id]/route.ts` — GET (상세), PUT (수정), DELETE (soft delete)

### GET /api/students (목록)

Query parameters:
- `page` (기본값: 1)
- `limit` (기본값: 20, 최대: 100)
- `search` (이름 검색 — nameKr, nameEn)
- `visaStatus` (ACTIVE, EXPIRING_SOON, EXPIRED, REVOKED)
- `enrollmentStatus` (ENROLLED, ON_LEAVE, EXPELLED, WITHDRAWN, GRADUATED, UNREGISTERED)
- `department` (학과 필터)
- `visaType` (D_2_1 ~ D_4_7)
- `sortBy` (기본값: createdAt)
- `sortOrder` (asc | desc, 기본값: desc)

응답 형식:
```json
{
  "success": true,
  "data": [...],
  "meta": { "total": 150, "page": 1, "limit": 20 }
}
```

중요:
- `isDeleted: false` 조건 항상 포함
- `universityId` 필터 필수 (세션의 universityId로 자동 필터 — 다른 대학 데이터 접근 불가)
- passportNumber, arcNumber는 목록에서 제외 (상세 조회 시에만 복호화)

### GET /api/students/:id (상세)

- passportNumber, arcNumber 복호화해서 반환
- 복호화 시 AuditLog 자동 기록
- VIEWER 역할은 PII 마스킹 처리 (예: `M1234****`)
- MANAGER, ADMIN만 전체 PII 조회 가능

### POST /api/students (생성)

- passportNumber, arcNumber는 `encrypt()` 로 암호화 후 저장
- 필수 필드 검증 (nameEn, nationality, passportNumber, visaType, visaExpiry, enrollmentStatus, programType, department)
- 생성 시 AuditLog 기록
- MANAGER, ADMIN만 가능

### PUT /api/students/:id (수정)

- 변경된 필드만 업데이트
- 변경 이력을 StatusChange 테이블에 기록 (field, oldValue, newValue, changedBy)
- PII 필드 변경 시 AuditLog 기록
- MANAGER, ADMIN만 가능

### DELETE /api/students/:id (soft delete)

- `isDeleted: true`로 업데이트 (실제 삭제 아님)
- AuditLog 기록
- ADMIN만 가능

---

## Task 4: Universities & Users API

### GET /api/universities (대학 목록)
- ADMIN만 접근 가능 (멀티테넌트 관리용)
- 또는 자기 대학 정보만 반환

### GET /api/users (담당자 목록)
- 같은 대학 소속 사용자만 반환
- ADMIN만 접근 가능

### POST /api/users (담당자 추가)
- ADMIN만 가능
- 비밀번호는 bcrypt 해시 후 저장
- 이메일 중복 검증

---

## Task 5: Dashboard Summary API

`src/app/api/dashboard/summary/route.ts`

현재 대학의 요약 통계를 반환합니다:

```json
{
  "success": true,
  "data": {
    "totalStudents": 487,
    "byVisaStatus": {
      "ACTIVE": 420,
      "EXPIRING_SOON": 35,
      "EXPIRED": 12,
      "REVOKED": 20
    },
    "byEnrollmentStatus": {
      "ENROLLED": 450,
      "ON_LEAVE": 20,
      "EXPELLED": 5,
      "WITHDRAWN": 2,
      "GRADUATED": 8,
      "UNREGISTERED": 2
    },
    "overstayRate": 1.8,
    "pendingFimsReports": 3,
    "unreadAlerts": 7,
    "upcomingVisaExpiries": [
      { "count": 15, "period": "30일 이내" },
      { "count": 35, "period": "60일 이내" },
      { "count": 52, "period": "90일 이내" }
    ]
  }
}
```

---

## Task 6: Seed Data (개발용 시드 데이터)

`prisma/seed.ts` 파일을 생성하세요.

`package.json`에 추가:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

시드 데이터 내용:

### 대학 1개
- 호서대학교 (충남 아산) / IEQAS CERTIFIED / overstayRate 1.8% / FREE_TRIAL

### 담당자 3명
| 이름 | 이메일 | 역할 | 비밀번호 |
|------|--------|------|---------|
| 김현정 | admin@hoseo.ac.kr | ADMIN | password123 |
| 이수진 | manager@hoseo.ac.kr | MANAGER | password123 |
| 박영호 | viewer@hoseo.ac.kr | VIEWER | password123 |

### 학생 50명 (다양한 상태 분포)

국적 분포 (실제 비율 반영):
- 중국: 15명 (30%)
- 베트남: 15명 (30%)
- 우즈베키스탄: 5명 (10%)
- 몽골: 5명 (10%)
- 기타(네팔, 방글라데시, 인도네시아 등): 10명 (20%)

비자 상태 분포:
- ACTIVE: 35명
- EXPIRING_SOON: 8명 (비자 만료 30~60일 이내)
- EXPIRED: 5명
- REVOKED: 2명

학적 상태 분포:
- ENROLLED: 40명
- ON_LEAVE: 4명
- EXPELLED: 2명
- WITHDRAWN: 1명
- GRADUATED: 2명
- UNREGISTERED: 1명

비자 유형: D-2-2 (학사) 60%, D-2-3 (석사) 20%, D-4-1 (어학연수) 15%, 기타 5%

학과: 컴퓨터공학과, 경영학과, 한국어학과, 기계공학과, 간호학과 등 5~8개 학과 분포

각 학생에게:
- 여권번호 (`encrypt()` 적용): 국적별 형식 (예: 중국 E12345678, 베트남 B1234567)
- 외국인등록번호 (`encrypt()` 적용): 형식 123456-1234567
- 출석률: 50~100% 범위
- GPA: 1.0~4.5 범위
- 비자 만료일: 2026-03-01 ~ 2027-06-30 범위로 다양하게
- 보험 상태: ACTIVE 70%, EXPIRING 15%, EXPIRED 10%, NONE 5%
- 연락처, 이메일, 체류지 주소 등 목업 데이터 포함

### AlertLog 10건
- 비자 만료 임박 알림 5건
- 출석률 저조 알림 3건
- FIMS 변동신고 기한 임박 2건

### FimsReport 5건
- PENDING 2건, READY 1건, SUBMITTED 1건, OVERDUE 1건

### StatusChange 10건
- 학적 변동, 비자 상태 변경 등 이력 데이터

---

## Task 7: DB 마이그레이션 + 시드 실행

```bash
npx prisma db push
npx prisma db seed
```

시드 실행 후 데이터가 정상 입력되었는지 확인해 주세요.

---

## Task 8: 완료 검증 (Verification Checklist)

모든 Task가 끝나면 아래 체크리스트를 **직접 실행**하고 결과를 출력하세요.

### 8-1. Build
```bash
npm run build
```
- [ ] 빌드 에러 0건
- [ ] TypeScript `any` 타입 새로 도입된 곳 0건

### 8-2. UX (Korean UI)
아래 명령어로 영문 하드코딩 라벨이 있는지 검출하세요:
```bash
# src/components와 src/app 내 .tsx 파일에서 영문 텍스트가 사용자에게 노출되는지 확인
grep -rn "error\|Error\|Success\|Delete\|Save\|Cancel\|Submit\|Loading\|Not found" src/components/ src/app/ --include="*.tsx" | grep -v "node_modules" | grep -v "// " | grep -v "import"
```
- [ ] 사용자에게 노출되는 영문 텍스트 0건 (코드 내부 변수/타입명은 제외)
- [ ] 에러 메시지가 한글이고 사용자 친화적인지 확인

### 8-3. Security & Legal
```bash
# PII가 암호화 없이 저장되는 곳이 있는지 확인
grep -rn "passportNumber\|arcNumber" src/app/api/ --include="*.ts" | grep -v "encrypt\|decrypt\|select.*false\|Encrypted\|masked"
```
- [ ] passportNumber/arcNumber가 `encrypt()` 없이 DB에 저장되는 경로 0건
- [ ] `console.log`에 PII가 포함된 곳 0건
- [ ] 모든 API route에 `universityId` 필터 존재 (다른 대학 데이터 접근 불가)
- [ ] 모든 데이터 변경 API에 RBAC 체크 존재
- [ ] PII 복호화 시 AuditLog 기록 확인
- [ ] DELETE 연산이 전부 soft delete (`isDeleted: true`)인지 확인

### 8-4. Spec Compliance
- [ ] API 응답이 `{ success, data, error, meta }` 형식을 따르는지 확인
- [ ] Phase 1 스코프에 없는 기능이 추가되지 않았는지 확인

### 8-5. Seed Data
```bash
npx prisma db seed
```
- [ ] 시드 실행 성공
- [ ] 학생 50명 데이터 정상 입력
- [ ] 암호화된 여권번호/ARC번호 복호화 테스트 성공

**모든 항목이 PASS면 Day 2 완료입니다. FAIL 항목이 있으면 수정 후 다시 체크하세요.**
