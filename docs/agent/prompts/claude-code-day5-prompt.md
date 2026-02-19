# LocalNomad B2B Visa Dashboard — Day 5: Import Pipeline E2E + W2 Wrap-Up

> **Prerequisites**: Day 1-4 complete. File upload, parsing, and column mapping engine are built. Now complete the full import pipeline: validation → import execution → result report.
> **Today's Goal**: Complete the Excel/CSV import E2E pipeline and polish the W2 deliverables.
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` (§3.5 Acceptance Criteria) first.

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

## Task 1: Import Validation API

Create `src/app/api/import/validate/route.ts`

POST /api/import/validate — Validates mapped data before import.

### Request Body:
```json
{
  "fileName": "students_2026.xlsx",
  "mappings": [
    { "sourceColumn": "학생이름", "targetField": "nameKr", "confidence": 98 },
    { "sourceColumn": "PASSPORT NO", "targetField": "passportNumber", "confidence": 97 }
  ],
  "data": [
    ["왕밍", "M12345678", "D-2-2", "2026-09-15", "95", ...],
    ["Nguyen Thi Lan", "B98765432", "D-4-1", "2026-12-20", "88", ...]
  ],
  "headers": ["학생이름", "PASSPORT NO", "체류자격코드", "D-2 만료일", "수강현황(%)"]
}
```

### Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 312,
      "valid": 298,
      "errors": 8,
      "duplicates": 6
    },
    "validRows": [
      { "rowIndex": 0, "data": { "nameKr": "왕밍", "visaType": "D_2_2", ... } }
    ],
    "errorRows": [
      {
        "rowIndex": 5,
        "data": { "nameEn": "", "visaType": "INVALID" },
        "errors": [
          { "field": "nameEn", "message": "필수 입력 항목입니다." },
          { "field": "visaType", "message": "유효하지 않은 비자 유형입니다." }
        ]
      }
    ],
    "duplicateRows": [
      {
        "rowIndex": 10,
        "data": { "nameEn": "Wang Ming", "passportNumber": "M12345678" },
        "existingStudentId": "...",
        "matchField": "passportNumber"
      }
    ]
  }
}
```

### Validation Rules:
- **Required fields** check: based on the mapped fields, verify that required system fields (nameEn, visaType, visaExpiry, department, enrollmentStatus, programType) have values
- **Format validation**:
  - visaType: must be a valid enum value (D_2_1 through D_2_8, D_4_1 through D_4_7, etc.)
  - visaExpiry: must be a valid date (parse various formats: YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, etc.)
  - attendanceRate: must be 0-100 numeric
  - gpa: must be 0.0-4.5 numeric
  - email: must be valid email format if provided
  - enrollmentStatus: must be valid enum value
  - programType: must be valid enum value
- **Duplicate detection**: check passportNumber and arcNumber against existing students in DB (same universityId)
  - If passportNumber is mapped and not empty, encrypt it first, then search for existing match
  - If arcNumber is mapped and not empty, same approach
  - Also check nameEn + nationality combination as secondary duplicate signal
- **Data transformation**: convert raw string values to proper types (dates, numbers, enums)
  - Visa type string → enum mapping (e.g., "D-2-2" → "D_2_2", "D-4-1" → "D_4_1")
  - Date strings → Date objects
  - Percentage strings (e.g., "95%") → number (95)
  - Korean enrollment status → enum (e.g., "재학" → "ENROLLED", "휴학" → "ON_LEAVE")

Auth required + RBAC check (`import:create` or `student:create` permission).

---

## Task 2: Import Execution API

Create `src/app/api/import/execute/route.ts`

POST /api/import/execute — Imports validated data into the database.

### Request Body:
```json
{
  "validRows": [...],
  "duplicateRows": [...],
  "duplicateAction": "skip" | "overwrite" | "manual"
}
```

### Behavior:
1. **Valid rows**: Create students via `prisma.student.createMany()` or loop with individual creates
   - Set `universityId` from session
   - Set `createdById` from session user
   - Encrypt PII fields (passportNumber, arcNumber) if present
   - Set default values for unmapped optional fields
2. **Duplicate handling** based on `duplicateAction`:
   - `"skip"`: Ignore duplicate rows entirely
   - `"overwrite"`: Update existing students with new data (PUT logic)
   - `"manual"`: Skip for now — return them as unresolved for user to handle later
3. **Transaction**: Wrap entire import in a Prisma transaction for atomicity
4. **Audit logging**: Create a single AuditLog entry for the import: action='IMPORT', details include file name, row counts
5. **Performance**: Use `createMany` where possible for bulk insert (faster than individual creates)

### Response:
```json
{
  "success": true,
  "data": {
    "imported": 298,
    "skipped": 6,
    "updated": 0,
    "failed": 8,
    "errors": [
      { "rowIndex": 5, "error": "데이터베이스 저장 중 오류가 발생했습니다." }
    ]
  }
}
```

Auth required + RBAC check.

---

## Task 3: Import Validation UI

Create `src/components/import/import-validation.tsx`

This is Step 3 of the import wizard (after file upload → column mapping → validation).

### UI Elements:
- **Summary banner** at top:
  - "총 312건 중 — ✅ 정상 298건, ❌ 오류 8건, ⚠️ 중복 6건"
  - Color-coded counts (green/red/amber)

- **Tabs**: 전체 / 정상 / 오류 / 중복

- **Data preview table** (show all rows with validation status):
  - Row number
  - Mapped fields as columns
  - Status badge per row (정상/오류/중복)
  - Error rows: highlight errored cells in red with tooltip showing error message
  - Duplicate rows: show which field matched and link to existing student

- **Duplicate resolution** section (shown in 중복 tab):
  - Per duplicate row: show side-by-side comparison (new data vs existing data)
  - Options: "기존 데이터 유지" / "새 데이터로 덮어쓰기"
  - Or bulk action: "전체 건너뛰기" / "전체 덮어쓰기"

- **Action buttons**:
  - "가져오기 실행" — starts import (only valid + resolved duplicate rows)
  - "돌아가기" — back to mapping step
  - Disable import button if 0 valid rows

---

## Task 4: Import Result Report

Create `src/components/import/import-result.tsx`

This is Step 4 (final step) — shown after import execution completes.

### UI Elements:
- **Result summary card**:
  - ✅ 가져오기 완료
  - "298건 등록 완료, 6건 건너뜀, 8건 실패"
  - Progress-bar style visualization

- **Detail sections** (collapsible):
  - 등록 완료 (298건): "성공적으로 등록되었습니다."
  - 건너뜀 (6건): List of skipped rows with reason
  - 실패 (8건): List of failed rows with error messages

- **Action buttons**:
  - "결과 다운로드 (CSV)" — download a CSV report of the import results
    - Columns: row number, status (성공/건너뜀/실패), error message, student name
  - "학생 목록으로 이동" — navigate to `/students`
  - "새 파일 가져오기" — reset wizard to step 1

### CSV Export:
Create a utility function that generates the CSV in-browser (no API call needed):
- Use proper Korean CSV encoding (UTF-8 with BOM for Excel compatibility)
- Columns: 행번호, 상태, 이름, 오류내용

---

## Task 5: Import Wizard Integration

Update `src/app/(dashboard)/import/page.tsx` to integrate all 4 steps into a complete wizard flow:

### Wizard Steps:
1. **파일 업로드** — FileUpload component (Day 4)
2. **컬럼 매핑** — ColumnMapping component (Day 4)
3. **데이터 검증** — ImportValidation component (Task 3)
4. **가져오기 완료** — ImportResult component (Task 4)

### Step Navigation:
- Step indicator at top showing current step (1/2/3/4) with Korean labels
- Each step passes data to the next via parent state (not URL params — too much data)
- "이전" (Back) button on steps 2-3
- Cannot skip steps
- Step transitions:
  - Step 1 → 2: When file is parsed successfully, pass headers + preview + raw data
  - Step 2 → 3: When mapping is confirmed, call validation API, pass results
  - Step 3 → 4: When import is executed, pass results
  - Step 4 → 1: "새 파일 가져오기" resets everything

### State Management:
Either use local React state in the page component (simpler, since data doesn't need to persist across page navigations) or extend a Zustand store. Choose whichever is simpler.

---

## Task 6: Verification Checklist

After all Tasks are complete, **run** the following checks and output the results.

### 6-1. Build
```bash
cd localnomad-b2b && npm run build
```
- [ ] 0 build errors
- [ ] 0 new TypeScript `any` types introduced

### 6-2. UX (Korean UI)
```bash
grep -rn "Loading\|Not found\|Error\|Submit\|Cancel\|Save\|Delete\|Search\|Filter\|Upload\|Import\|Export\|Download\|Success\|Failed\|Skip\|Overwrite\|Back\|Next\|Previous\|Step\|Valid\|Invalid\|Duplicate\|Result" src/components/import/ src/app/api/import/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "// " | grep -v "import" | grep -v "interface\|type \|enum " | grep -v ".test."
```
- [ ] All button labels in Korean (가져오기 실행, 돌아가기, 결과 다운로드, etc.)
- [ ] All status labels in Korean (정상, 오류, 중복, 성공, 실패, 건너뜀)
- [ ] All validation messages in Korean
- [ ] All wizard step labels in Korean

### 6-3. Security
- [ ] Validate API has auth + RBAC check
- [ ] Execute API has auth + RBAC check
- [ ] PII fields (passportNumber, arcNumber) encrypted before DB insert
- [ ] universityId set from session (not from request body)
- [ ] createdById set from session
- [ ] Audit log created for import operation
- [ ] No PII in validation response (mask passport/ARC in preview)

### 6-4. Import Pipeline E2E
- [ ] File upload → parse → mapping → validate → execute → result: all steps connected
- [ ] Duplicate detection works (finds existing students by passport/ARC number)
- [ ] Duplicate resolution options work (skip/overwrite)
- [ ] Error rows are excluded from import
- [ ] CSV result download generates proper UTF-8 BOM file
- [ ] Transaction rollback on failure (atomic import)

### 6-5. Spec Compliance (§3.5 Acceptance Criteria)
- [ ] xlsx/xls/csv/tsv file upload works
- [ ] Column mapping shows confidence levels (🟢/🟡/🔴)
- [ ] Manual mapping override works
- [ ] Duplicate detection by passportNumber/arcNumber
- [ ] Duplicate resolution options: skip / overwrite
- [ ] Import result report downloadable as CSV
- [ ] API responses follow `{ success, data, error, meta }` format

**If all items PASS, Day 5 is complete. If any item FAILS, fix it and re-check.**

---

## 📌 Note: W2 Completion

After Day 5, W2 is complete. The W2 deliverables are:
- ✅ Dashboard main with real API data
- ✅ Student list with TanStack Table (search, filter, sort, pagination)
- ✅ Student detail view with traffic light + timeline
- ✅ Student create/edit form
- ✅ Traffic light status engine
- ✅ Visa expiry calendar (month/week/list views)
- ✅ Excel/CSV import with column mapping E2E

The W2 Gate review (1,000-record performance test, full CRUD walkthrough, import E2E test, traffic light unit tests) will be conducted separately by the Cowork agent.
