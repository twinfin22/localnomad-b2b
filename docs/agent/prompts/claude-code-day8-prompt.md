# LocalNomad B2B Visa Dashboard — Day 8: FIMS Export + Status Change Detection

> **Prerequisites**: Day 1-7 complete. AI Chatbot MVP (PII masking, intent classification, safety filter, escalation, chat widget, FAQ KB) is done.
> **Today's Goal**: Build FIMS-compatible Excel export system and status change detection workflow. These are the core P0 features for university staff daily workflow.
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` (§3.7 FIMS Export, §3.8 Status Change Report) first.
> **W0 Note**: Actual FIMS form templates from pilot universities may not be available yet. Use standard MOJ FIMS fields (13 fields) as the base format. The system must be template-driven so forms can be updated later without code changes.

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

## Task 0: Housekeeping — CLAUDE.md Tech Stack Update

**Goal**: Add Playwright to the tech stack in `CLAUDE.md` since it was added in Day 7.

### Steps:
1. Open `CLAUDE.md`
2. In the **Tech Stack** section, add under Testing:
   ```
   - **Unit Test**: Vitest
   - **E2E Test**: Playwright
   ```
3. No other changes needed.

### Acceptance Criteria:
- [ ] CLAUDE.md Tech Stack lists both Vitest and Playwright

---

## Task 1: FIMS Export Templates + Configuration

**Goal**: Create a template-driven FIMS export system. Templates define which fields go into which columns for each export type, so universities can customize their FIMS forms without code changes.

### 1-1. Export Template Data Structure

Create `src/lib/fims/export-templates.ts`:

```typescript
// 4 export template types
export type FimsExportType =
  | 'STUDENT_INFO'      // 학생 기본정보 (FIMS 등록)
  | 'STATUS_CHANGE'      // 변동신고 (status change report)
  | 'PERIODIC_REPORT'    // 정기보고 통계 (quarterly stats)
  | 'BATCH_VISA';        // 단체접수 데이터

export interface FimsExportColumn {
  key: string;           // internal field name (maps to Student model)
  label: string;         // Korean column header in FIMS form
  width: number;         // Excel column width
  required: boolean;     // is this field mandatory for FIMS?
  format?: string;       // date format, number format, etc.
  transform?: string;    // transformation rule name (e.g., 'visaTypeToKorean', 'genderToKorean')
}

export interface FimsExportTemplate {
  type: FimsExportType;
  name: string;          // Korean display name
  description: string;   // Korean description
  version: string;       // template version (e.g., '2026-01')
  columns: FimsExportColumn[];
}
```

### 1-2. Define 4 Export Templates

**Template 1 — STUDENT_INFO (학생 기본정보)**: 13 columns
- 성명(영문), 성명(한글), 성별, 생년월일, 국적, 여권번호, 외국인등록번호
- 비자유형, 체류만료일, 소속학과, 교육과정, 학번, 연락처

**Template 2 — STATUS_CHANGE (변동신고)**: 10 columns
- 성명(영문), 외국인등록번호, 비자유형, 소속학과
- 변동유형 (휴학/제적/자퇴/졸업/미등록/소속변경)
- 변동일, 변동사유, 신고기한, 처리상태, 비고

**Template 3 — PERIODIC_REPORT (정기보고 통계)**: Aggregated stats
- 교육과정별 인원수 (학사/석사/박사/어학연수)
- 국적별 인원수
- 재학상태별 인원수 (재학/휴학/제적/자퇴/졸업/미등록)
- 비자유형별 인원수
- 전체 출석률 평균, 불법체류율

**Template 4 — BATCH_VISA (단체접수)**: 12 columns
- 성명(영문), 성명(한글), 국적, 여권번호, 외국인등록번호
- 비자유형, 체류만료일, 소속학과, 교육과정, 출석률, 학점(GPA)
- 보험상태

### 1-3. Field Transformers

Create `src/lib/fims/field-transformers.ts`:

Transformation functions for FIMS-compatible values:
- `visaTypeToKorean(visaType)`: D_2_1 → "전문학사(D-2-1)"
- `enrollmentStatusToKorean(status)`: ENROLLED → "재학"
- `programTypeToKorean(type)`: BACHELOR → "학사"
- `genderToKorean(gender)`: M → "남", F → "여"
- `nationalityToKorean(code)`: CN → "중국", VN → "베트남" (top 20 nationalities)
- `insuranceToKorean(status)`: ACTIVE → "가입", EXPIRED → "만료"
- `formatDate(date)`: → "YYYY-MM-DD" or "YYYY.MM.DD"
- `formatPhone(phone)`: normalize to 010-XXXX-XXXX

### Acceptance Criteria:
- [ ] 4 export templates defined with correct FIMS field mappings
- [ ] All field transformer functions implemented
- [ ] Templates are data-driven (admin can later update via settings)
- [ ] All Korean labels match standard FIMS terminology

---

## Task 2: FIMS Export API

**Goal**: API endpoint that generates Excel files from templates.

### 2-1. Export API Route

Create `src/app/api/fims/export/route.ts`:

**POST /api/fims/export**

Request body:
```typescript
{
  exportType: FimsExportType,    // 'STUDENT_INFO' | 'STATUS_CHANGE' | 'PERIODIC_REPORT' | 'BATCH_VISA'
  filters?: {
    enrollmentStatus?: EnrollmentStatus[],
    visaType?: VisaType[],
    department?: string,
    visaExpiryBefore?: string,   // for batch visa: students expiring within 90 days
  },
  studentIds?: string[],         // optional: specific students only
  format?: 'xlsx' | 'csv'       // default: xlsx
}
```

Response: Binary file download (Excel or CSV)

### 2-2. Export Logic

Create `src/lib/fims/export-generator.ts`:

Flow:
1. Get the template for the requested `exportType`
2. Fetch students from DB (with filters, scoped to `universityId` from session)
3. For `PERIODIC_REPORT`: aggregate data instead of individual rows
4. Apply field transformers to each cell
5. **CRITICAL**: Decrypt PII fields (passportNumber, arcNumber) using `decrypt()` from `src/lib/crypto.ts`
6. **CRITICAL**: Create AuditLog entry for PII access: `{ action: 'EXPORT', resource: 'FIMS_REPORT', details: { exportType, studentCount, fields } }`
7. Generate Excel using SheetJS (xlsx) — already installed from Day 4
8. Set proper headers, column widths, styles (bold header row, borders)
9. Return as downloadable file

### 2-3. Missing Field Validation

Before generating the export, check for missing required fields:
- For each student, check all `required: true` columns in the template
- Return warnings (NOT errors — staff can still export with gaps):

```typescript
{
  success: true,
  data: {
    downloadUrl: string,        // temporary signed URL or blob
    stats: {
      totalStudents: number,
      completeRecords: number,  // all required fields present
      incompleteRecords: number,
      missingFields: { field: string, count: number }[]
    }
  }
}
```

Wait — the response needs to return the file. Here's the actual approach:
- If `?preview=true` query param: return the stats/warnings JSON (no file)
- If no preview: return the actual Excel file as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### 2-4. Export History Logging

Create `src/app/api/fims/export/history/route.ts`:

**GET /api/fims/export/history**
- Returns list of past exports (from AuditLog where action='EXPORT' AND resource='FIMS_REPORT')
- Paginated, most recent first
- Shows: exportType, date, user, studentCount

### 2-5. Security Requirements

- ✅ Auth required (getServerSession)
- ✅ RBAC: ADMIN and MANAGER can export (VIEWER cannot)
- ✅ universityId scoping on all student queries
- ✅ AuditLog created for every export (PII is decrypted)
- ✅ Passport/ARC numbers decrypted only at export time, never cached

### Acceptance Criteria:
- [ ] POST /api/fims/export generates correct Excel file for all 4 types
- [ ] Preview mode returns missing field warnings
- [ ] AuditLog created for every export
- [ ] RBAC enforced (ADMIN/MANAGER only)
- [ ] All data scoped to universityId
- [ ] PII decrypted only at export time
- [ ] Export history API returns past exports
- [ ] Excel file has proper Korean headers, column widths, bold header row

---

## Task 3: FIMS Export UI

**Goal**: Build the FIMS page UI with export controls, preview, and history.

### 3-1. FIMS Page Layout

Update `src/app/(dashboard)/fims/page.tsx`:

Layout:
```
┌─────────────────────────────────────────────────────┐
│ FIMS 관리                                            │
├─────────────────────────────────────────────────────┤
│ [Tab: 내보내기] [Tab: 변동신고] [Tab: 정기보고]        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Export Tab (내보내기):                                │
│  ┌──────────────────────────────────────────────┐   │
│  │ Export Type Cards (4 cards in 2x2 grid)       │   │
│  │ ┌─────────────┐ ┌─────────────┐              │   │
│  │ │ 학생 기본정보 │ │ 변동신고    │              │   │
│  │ └─────────────┘ └─────────────┘              │   │
│  │ ┌─────────────┐ ┌─────────────┐              │   │
│  │ │ 정기보고     │ │ 단체접수    │              │   │
│  │ └─────────────┘ └─────────────┘              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  After selecting type:                               │
│  ┌──────────────────────────────────────────────┐   │
│  │ Filters (enrollment status, visa type, etc.)  │   │
│  │ [미리보기] [내보내기]                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Preview Result (if clicked 미리보기):               │
│  ┌──────────────────────────────────────────────┐   │
│  │ 전체 N명 | 완전 N명 | 불완전 N명              │   │
│  │ Missing: 여권번호 (12명), 출석률 (5명)...     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Export History (최근 내보내기 기록):                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ 2026-02-15 | 학생 기본정보 | 김현정 | 156명   │   │
│  │ 2026-02-14 | 단체접수     | 김현정 | 78명    │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 3-2. Components to Create

- `src/components/fims/export-type-card.tsx` — Card for each export type (icon, name, description, student count)
- `src/components/fims/export-filters.tsx` — Filter panel (enrollment status, visa type, department, date range for batch visa)
- `src/components/fims/export-preview.tsx` — Preview result with missing field warnings
- `src/components/fims/export-history.tsx` — Table of past exports

### 3-3. Export Flow UX

1. Staff selects export type card → card highlights with indigo border
2. Filter options appear below (context-dependent on export type)
3. Staff clicks "미리보기" → calls POST /api/fims/export?preview=true → shows stats
4. Staff reviews missing fields → decides to proceed or fix data first
5. Staff clicks "내보내기" → calls POST /api/fims/export → browser downloads Excel
6. Toast notification: "FIMS 내보내기 완료 (N명)" or error message
7. Export history updates automatically

### Acceptance Criteria:
- [ ] 4 export type cards displayed in 2×2 grid
- [ ] Filters work per export type
- [ ] Preview shows missing field count before export
- [ ] Excel download works in browser
- [ ] Export history shows recent exports
- [ ] All text in Korean
- [ ] FIMS page has 3 tabs (내보내기, 변동신고, 정기보고)

---

## Task 4: Status Change Detection + FIMS 변동신고 Workflow

**Goal**: Detect when student enrollment status changes (via profile edit or re-import) and create FIMS 변동신고 reports with 15-day countdown.

### 4-1. Status Change Detection Hook

Create `src/lib/fims/status-change-detector.ts`:

This function is called whenever a student's enrollmentStatus is updated:

```typescript
export async function detectStatusChange(
  studentId: string,
  oldStatus: EnrollmentStatus,
  newStatus: EnrollmentStatus,
  changedBy: string
): Promise<void> {
  // 1. Only trigger for specific transitions FROM ENROLLED:
  //    ENROLLED → ON_LEAVE, EXPELLED, WITHDRAWN, GRADUATED, UNREGISTERED
  //    Also: any status → TRANSFER (department change)

  // 2. Skip if transition is not FIMS-reportable
  //    (e.g., ON_LEAVE → ENROLLED is a return, not a status change report)

  // 3. Create StatusChange record

  // 4. Create FimsReport record:
  //    - reportType: STATUS_CHANGE
  //    - changeType: map newStatus to FimsChangeType
  //    - deadline: today + 15 calendar days
  //    - status: PENDING

  // 5. Create AlertLog for the assigned staff:
  //    - type: FIMS_DEADLINE
  //    - title: "변동신고 필요: {studentName} ({changeType})"
  //    - message: "신고기한: {deadline} (D-15)"
}
```

### 4-2. Integrate Detection into Existing Code

**Student Update API** (`src/app/api/students/[id]/route.ts` — PATCH handler):
- After updating student, check if `enrollmentStatus` changed
- If changed: call `detectStatusChange(studentId, oldStatus, newStatus, session.user.id)`

**Import Execution** (`src/app/api/import/execute/route.ts`):
- During bulk import with `overwrite` mode, when existing student's enrollmentStatus differs
- Call `detectStatusChange()` for each changed student
- This handles the "re-import with updated data" scenario

### 4-3. 변동신고 Status Board API

Create `src/app/api/fims/reports/route.ts`:

**GET /api/fims/reports**
- Query params: `?type=STATUS_CHANGE&status=PENDING,READY,OVERDUE&page=1&limit=20`
- Returns FimsReport records joined with Student data
- Sorted by deadline (most urgent first)
- Include computed fields:
  - `daysRemaining`: deadline - today
  - `urgencyLevel`: GREEN (>7 days), YELLOW (4-7 days), RED (1-3 days), BLACK (overdue)

**PATCH /api/fims/reports/[id]**
- Update report status: PENDING → READY → SUBMITTED
- `READY`: staff has prepared the data
- `SUBMITTED`: staff has entered into FIMS, records submittedAt + submittedById
- Validate status transitions (no skipping steps, no going backward)

### 4-4. 변동신고 Tab UI

Create `src/components/fims/status-change-board.tsx`:

This is the second tab ("변동신고") on the FIMS page.

Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Summary Cards:                                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ 대기 (5)  │ │ 준비완료  │ │ 완료 (12)│ │ 기한초과  │    │
│ │  PENDING  │ │ READY(3) │ │SUBMITTED │ │OVERDUE(1)│    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────┤
│ Filter: [전체] [대기] [준비완료] [기한초과]               │
├─────────────────────────────────────────────────────────┤
│ Report Card (for each pending/ready report):             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔴 D-3  홍길동 (중국) | 휴학 | 기한: 2026-02-19     │ │
│ │ 학과: 컴퓨터공학과 | 비자: D-2-2 | ARC: ***-***1234 │ │
│ │                                                      │ │
│ │ Status: ○ 대기 → ○ 준비완료 → ○ FIMS 입력 완료      │ │
│ │                                                      │ │
│ │ [준비완료로 변경]  [FIMS 데이터 미리보기]              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ (more report cards...)                                   │
└─────────────────────────────────────────────────────────┘
```

### 4-5. Deadline Alert Scheduling

Update `src/lib/alert-engine.ts` to include a new rule:

**Rule: FIMS Deadline Approaching**
- Query: FimsReport WHERE status IN (PENDING, READY) AND deadline approaching
- D-7: Create YELLOW alert (IN_APP)
- D-3: Create RED alert (IN_APP + EMAIL)
- D+1 (overdue): Create BLACK alert (IN_APP + EMAIL) — update report status to OVERDUE

This should run as part of the existing alert engine check cycle (which was built in Day 6).

### Acceptance Criteria:
- [ ] Status change detected on student profile edit (PATCH /api/students/:id)
- [ ] Status change detected on re-import (overwrite mode)
- [ ] FimsReport created with correct changeType and 15-day deadline
- [ ] FIMS reports API returns reports sorted by urgency
- [ ] Status transitions work: PENDING → READY → SUBMITTED
- [ ] 변동신고 tab shows report cards with countdown
- [ ] Deadline alerts fire at D-7, D-3, D+1
- [ ] AuditLog created for status changes
- [ ] All text in Korean

---

## Task 5: Verification Checklist

After completing Tasks 0-4, run the full verification:

### Build
- [ ] `npm run build` — 0 errors
- [ ] `npx prisma generate` — 0 errors (no schema changes in this prompt)
- [ ] No TypeScript `any` types introduced
- [ ] Existing tests still pass (`npm run test`)

### FIMS Export
- [ ] STUDENT_INFO export generates correct 13-column Excel
- [ ] STATUS_CHANGE export generates correct 10-column Excel
- [ ] PERIODIC_REPORT export generates aggregated statistics
- [ ] BATCH_VISA export filters students with visa expiring in 90 days
- [ ] Missing field preview works before export
- [ ] Export history is logged and displayed

### Status Change Detection
- [ ] Editing student's enrollmentStatus from ENROLLED → ON_LEAVE creates FimsReport
- [ ] Re-importing with different enrollmentStatus triggers detection
- [ ] FimsReport has correct 15-day deadline
- [ ] Report status transitions work (PENDING → READY → SUBMITTED)
- [ ] Cannot skip status steps or go backward

### Security & Korean UI
- [ ] Export API requires ADMIN/MANAGER role
- [ ] Export API scoped to universityId
- [ ] AuditLog created for every export (with PII access)
- [ ] PII decrypted only during export generation
- [ ] All user-facing text in Korean
- [ ] Error messages are user-friendly Korean

### Spec Compliance
- [ ] API responses follow `{ success, data, error, meta }` format
- [ ] Matches Phase1_프로덕트_스펙_v2.1.md §3.7 (FIMS Export)
- [ ] Matches Phase1_프로덕트_스펙_v2.1.md §3.8 (Status Change Report)

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 0 | CLAUDE.md Playwright update | CLAUDE.md |
| 1 | FIMS export templates + transformers | src/lib/fims/export-templates.ts, field-transformers.ts |
| 2 | FIMS export API + history | src/app/api/fims/export/route.ts, history/route.ts |
| 3 | FIMS export UI (4 types, preview, history) | src/components/fims/*.tsx, fims/page.tsx |
| 4 | Status change detection + 변동신고 board | src/lib/fims/status-change-detector.ts, fims/reports API, components |
| 5 | Verification | Build, export correctness, security, Korean UI |
