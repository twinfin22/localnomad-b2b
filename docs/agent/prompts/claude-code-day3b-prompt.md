# LocalNomad B2B Visa Dashboard — Day 3b: Student Detail Panel + Form + Bugfixes

> **Prerequisites**: Day 3a (Traffic Light engine, Dashboard API integration, Student list with TanStack Table) is complete.
> **Today's Goal**: Build the student detail slide panel, student create/edit form, and fix 2 issues from Day 3a.
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` first and follow all conventions.

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

## Task 0: Day 3a Bugfixes (Do This First)

Two issues were found during Day 3a review. Fix them before starting new tasks.

### 0-1. Dashboard Summary API — Missing RBAC Check

**File**: `src/app/api/dashboard/summary/route.ts`

The route currently only checks `if (!session)` but does not call `withRbac()`. Add RBAC enforcement. Since this is a read-only dashboard endpoint, any authenticated user should be able to access it (ADMIN/MANAGER/VIEWER all allowed). However, the `withRbac()` call must still be present for consistency and defense in depth.

Add `withRbac(session, 'student', 'read')` check (since dashboard reads student data). If a more specific permission like `dashboard:read` doesn't exist in the RBAC matrix, use `student:read` which all roles have access to.

### 0-2. IEQAS Overstay Rate — Dynamic Calculation

**File**: `src/app/api/dashboard/summary/route.ts`

Currently the API returns the stored `university.overstayRate` field. This must be computed dynamically.

The spec defines IEQAS overstay rate as:
```
overstayRate = (expired visa + unregistered + expelled with unknown whereabouts) / total students × 100
```

Implementation:
- Count students where `visaStatus = 'EXPIRED'` OR `enrollmentStatus IN ('UNREGISTERED', 'EXPELLED')` (within same university, `isDeleted: false`)
- Divide by total active students count
- Multiply by 100 for percentage
- Return as `overstayRate` in the summary response (replace the stored field)
- Keep 2 decimal places (e.g., 1.23)

---

## Task 1: Student Detail Slide Panel

Create `src/components/students/student-detail-panel.tsx`

A slide-in panel that opens from the right when a row is clicked in the student list:

### 1-1. Panel Structure
- Slides in from the right side of the screen
- Width: ~480px (fixed)
- Close button (X) in top-right corner
- Click outside or press Escape to close
- Use shadcn/ui Sheet component for the slide panel behavior

### 1-2. Basic Info Section
- Traffic Light status badge at the top with colored dot + Korean label (정상/주의/긴급)
- Reason list below the badge (if YELLOW or RED, show all reasons from the traffic light engine)
- Basic info grid:
  - 이름 (Korean + English)
  - 국적
  - 학과
  - 학번
  - 비자 유형
  - 비자 만료일 (with D-day countdown, e.g., "D-25")
  - 비자 상태
- Contact info:
  - 전화번호
  - 이메일
  - 카카오톡 ID
- PII section (MANAGER/ADMIN only, hidden for VIEWER):
  - 여권번호: Show masked by default (e.g., "M1234****")
  - "전체 보기" button next to it
  - On click: call `GET /api/students/:id` which triggers decryption + AuditLog
  - Show full passport number after click
  - 외국인등록번호: Same masking + reveal pattern
  - If passport/ARC is null, show "미등록" in gray text
- Academic info:
  - 학적 상태
  - 과정 유형
  - 학기
  - 출석률 (with color: green ≥80%, yellow ≥60%, red <60%)
  - GPA
- Insurance info:
  - 보험 상태 (with badge color)
  - 보험 만료일
- Address info:
  - 체류지 주소
  - 변경 신고 여부 (✅ 완료 / ❌ 미신고)

### 1-3. Timeline Section (below basic info, scrollable)
- Title: "활동 이력"
- Show recent events in reverse chronological order (latest first)
- Merge 3 data sources into one timeline:
  - StatusChange records (e.g., "학적 상태 변경: 재학 → 휴학")
  - AlertLog records (e.g., "비자 만료 알림 발송 (이메일)")
  - FimsReport records (e.g., "FIMS 변동신고 제출 (휴학)")
- Each entry shows:
  - Date (format: YYYY-MM-DD)
  - Icon per type (status change / alert / FIMS)
  - Brief Korean description
- Show up to 20 most recent items
- If no history: "활동 이력이 없습니다."

### 1-4. Action Buttons (bottom of panel, sticky)
- "수정" button — visible only for MANAGER/ADMIN
  - Click → navigate to `/students/:id/edit` (create this page in Task 3)
- "삭제" button — visible only for ADMIN
  - Click → show confirmation dialog (shadcn/ui AlertDialog)
  - Dialog text: "정말 이 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
  - Confirm → call `DELETE /api/students/:id` (soft delete)
  - On success → close panel + refresh student list + show toast "학생이 삭제되었습니다."

### 1-5. Enhance Student Detail API

Modify `src/app/api/students/[id]/route.ts` GET response to also include:

- `trafficLight`: Calculate using the traffic light engine (import from `src/lib/traffic-light.ts`)
  - Include `status` and `reasons`
- `timeline`: Query and merge the following, sorted by date descending, limit 20:
  - `StatusChange` records for this student
  - `AlertLog` records for this student
  - `FimsReport` records for this student
  - Each item should have: `type` ('status_change' | 'alert' | 'fims'), `date`, `description` (Korean)

The timeline descriptions should be human-readable Korean, e.g.:
- StatusChange: "학적 상태 변경: 재학 → 휴학" or "비자 상태 변경: ACTIVE → EXPIRED"
- AlertLog: "비자 만료 알림 발송 (이메일)" or "출석률 경고 알림 (카카오)"
- FimsReport: "FIMS 변동신고 제출 (휴학)" or "FIMS 정기보고 작성 중"

---

## Task 2: Student Create/Edit Form

Create `src/components/students/student-form.tsx`

A shared form component for both new student registration and editing existing students.

### 2-1. Form Layout
- Use a responsive form layout with labeled fields
- Group fields into sections with Korean headings:
  - **기본 정보** (Basic Info)
  - **비자 정보** (Visa Info)
  - **학적 정보** (Academic Info)
  - **민감 정보** (PII — show note: "위탁계약 체결 후 입력 가능")
  - **보험 정보** (Insurance)
  - **연락처** (Contact)
  - **체류지 정보** (Address)
  - **기타** (Other)

### 2-2. Form Fields

**기본 정보:**
- 이름 (한글) — text input, optional
- 이름 (영문) — text input, **required**
- 국적 — select dropdown with common nationalities (VN, CN, UZ, MN, NP, BD, PH, ID, etc.), **required**
- 학과 — text input, **required**
- 학번 — text input, optional

**비자 정보:**
- 비자 유형 — select dropdown (D-2-1 through D-2-8, D-4-1 through D-4-7), **required**
- 비자 만료일 — date picker, **required** (allow past dates)
- 비자 상태 — select (ACTIVE / EXPIRING_SOON / EXPIRED / REVOKED), default ACTIVE

**학적 정보:**
- 학적 상태 — select (ENROLLED / ON_LEAVE / EXPELLED / WITHDRAWN / GRADUATED / UNREGISTERED), **required**
- 과정 유형 — select (ASSOCIATE / BACHELOR / MASTER / DOCTORATE / LANGUAGE_PROGRAM), **required**
- 학기 — text input (e.g., "2026-1"), optional
- 출석률 — number input (0-100), optional
- GPA — number input (0.0-4.5), optional

**민감 정보 (all optional):**
- 여권번호 — text input
- 여권 만료일 — date picker
- 외국인등록번호 — text input
- Show helper text: "이 정보는 AES-256으로 암호화되어 저장됩니다."

**보험 정보:**
- 보험 상태 — select (ACTIVE / EXPIRING / EXPIRED / NONE), default NONE
- 보험 만료일 — date picker, optional

**연락처:**
- 전화번호 — text input
- 이메일 — text input (email format validation)
- 카카오톡 ID — text input
- 비상연락처 — text input

**체류지 정보:**
- 주소 — textarea
- 체류지 변경 신고 완료 — checkbox
- 변경일 — date picker (shown only when checkbox is checked)

**기타:**
- 메모 — textarea

### 2-3. Validation Rules
- Required fields show red border + Korean error below: "필수 입력 항목입니다."
- Email format: "올바른 이메일 형식이 아닙니다."
- Attendance rate 0-100: "0에서 100 사이의 값을 입력해주세요."
- GPA 0.0-4.5: "0.0에서 4.5 사이의 값을 입력해주세요."
- Validate on submit, not on every keystroke (except debounced for better UX)

### 2-4. Submit Behavior
- **New student** (no existing data passed):
  - POST /api/students
  - On success: navigate to `/students` + toast "학생이 등록되었습니다."
  - On error: show API error message as toast
- **Edit student** (existing data passed as prop):
  - PUT /api/students/:id
  - On success: toast "학생 정보가 수정되었습니다." + trigger refetch in parent
  - On error: show API error message as toast
- Submit button text: "등록" (new) or "저장" (edit)
- Cancel button: navigate back or close panel
- Disable submit button while request is in progress (prevent double submit)
- MANAGER and ADMIN only (VIEWER should not see the form)

---

## Task 3: Student Registration & Edit Pages

### 3-1. New Student Page

Create `src/app/(dashboard)/students/new/page.tsx`

- Page title: "새 학생 등록"
- Breadcrumb: 학생 관리 > 새 학생 등록
- Render the student-form component (empty, create mode)
- Back button or breadcrumb link → `/students`
- RBAC: only MANAGER/ADMIN can access (redirect VIEWER to `/students`)

### 3-2. Edit Student Page

Create `src/app/(dashboard)/students/[id]/edit/page.tsx`

- Page title: "학생 정보 수정"
- Breadcrumb: 학생 관리 > 학생 정보 수정
- Fetch student data from `GET /api/students/:id` and pass to student-form component (edit mode)
- Loading state while fetching
- 404 handling: if student not found, show "학생을 찾을 수 없습니다." with link back to `/students`
- RBAC: only MANAGER/ADMIN can access

### 3-3. Update Student List Row Click

Currently the student table row click navigates to `/students/:id`. Change it to open the **detail slide panel** (from Task 1) instead of navigating to a new page. The panel should fetch and display the selected student's data.

Update `src/components/students/student-table.tsx`:
- Row click → set selected student ID in state → open Sheet panel
- Pass student ID to `StudentDetailPanel` component
- Panel fetches full student data (including trafficLight and timeline)

---

## Task 4: Verification Checklist

After all Tasks are complete, **run** the following checks and output the results.

### 4-1. Build
```bash
cd localnomad-b2b && npm run build
```
- [ ] 0 build errors
- [ ] 0 new TypeScript `any` types introduced

### 4-2. UX (Korean UI)
```bash
grep -rn "Loading\|Not found\|Error\|Submit\|Cancel\|Save\|Delete\|Search\|Filter\|No data\|No results\|Confirm\|Close\|Back\|Edit\|Create\|New\|View" src/components/ src/app/ --include="*.tsx" | grep -v "node_modules" | grep -v "// " | grep -v "import" | grep -v "interface\|type \|enum " | grep -v ".test."
```
- [ ] 0 English text strings visible to users
- [ ] All form labels are Korean
- [ ] All validation messages are Korean
- [ ] All button labels are Korean
- [ ] Empty states and 404 messages are Korean

### 4-3. Security & Legal
```bash
grep -rn "passportNumber\|arcNumber" src/app/api/ src/components/ --include="*.ts" --include="*.tsx" | grep -v "encrypt\|decrypt\|select.*false\|Encrypted\|masked\|omit\|exclude\|PII\|audit\|interface\|type \|mask\|null\|미등록"
```
- [ ] PII is masked in detail panel (not shown in full by default)
- [ ] PII reveal triggers API call that creates AuditLog
- [ ] PII encryption on create/edit (passportNumber and arcNumber go through encrypt())
- [ ] All API calls include universityId filter
- [ ] RBAC checks: detail panel respects role, form restricted to MANAGER/ADMIN, delete to ADMIN only
- [ ] Dashboard summary API now has RBAC check (Task 0 fix)

### 4-4. IEQAS Overstay Rate
- [ ] Dashboard summary API computes overstayRate dynamically (not from stored field)
- [ ] Calculation: (EXPIRED visa + UNREGISTERED + EXPELLED) / total × 100
- [ ] Returns 2 decimal places

### 4-5. Spec Compliance
- [ ] API responses follow `{ success, data, error, meta }` format
- [ ] Student detail includes trafficLight status + reasons
- [ ] Student detail includes timeline (merged StatusChange + AlertLog + FimsReport)
- [ ] Form handles both create and edit modes
- [ ] Soft delete with confirmation dialog on student deletion
- [ ] Toast notifications on create/edit/delete success

**If all items PASS, Day 3b is complete. If any item FAILS, fix it and re-check.**
