# LocalNomad B2B Visa Dashboard — Day 4: Visa Expiry Calendar + Excel Import Foundation

> **Prerequisites**: Day 1-3 complete (project init, auth, RBAC, CRUD APIs, seed data, traffic light engine, dashboard integration, student list/detail/form).
> **Today's Goal**: Build the visa expiry calendar view and lay the foundation for Excel/CSV import (file upload + column mapping engine).
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` (§3.4, §3.5) first and follow all conventions.

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

## Task 0: Carry-Over Bugfixes from Day 3a (Do This First)

These two issues were identified in Day 3a review but were not fixed in Day 3b. They must be fixed now.

### 0-1. Dashboard Summary API — Add RBAC Check

**File**: `src/app/api/dashboard/summary/route.ts`

The GET handler currently checks `if (!session)` but does NOT call `withRbac()`. Add it:

```typescript
const rbacError = withRbac(session, 'student', 'read');
if (rbacError) return rbacError;
```

Use `'student', 'read'` permission since the dashboard reads student data, and all roles (ADMIN/MANAGER/VIEWER) have this permission.

### 0-2. IEQAS Overstay Rate — Dynamic Calculation

**File**: `src/app/api/dashboard/summary/route.ts`

Replace the current `university.overstayRate` (stored value) with a dynamic computation:

```typescript
// Count students contributing to overstay
const overstayCount = await prisma.student.count({
  where: {
    universityId,
    isDeleted: false,
    OR: [
      { visaStatus: 'EXPIRED' },
      { enrollmentStatus: 'UNREGISTERED' },
      { enrollmentStatus: 'EXPELLED' },
    ],
  },
});

// Total active students (not deleted)
const totalStudents = await prisma.student.count({
  where: { universityId, isDeleted: false },
});

const overstayRate = totalStudents > 0
  ? Math.round((overstayCount / totalStudents) * 10000) / 100  // 2 decimal places
  : 0;
```

Return this computed `overstayRate` instead of the stored field.

---

## Task 1: Visa Expiry Calendar API

Create `src/app/api/calendar/route.ts`

GET /api/calendar — Returns visa expiry data for calendar rendering.

### Query Parameters:
- `year` (required): e.g., 2026
- `month` (required): 1-12
- `view`: 'month' | 'week' | 'list' (default: 'month')
- `week`: ISO week number (required when view=week)
- `filter`: '30' | '60' | '90' | 'all' (for list view, default: 'all')

### Response Format:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "date": "2026-03-15",
        "students": [
          {
            "id": "...",
            "nameKr": "왕밍",
            "nameEn": "Wang Ming",
            "department": "컴퓨터공학과",
            "visaType": "D_2_2",
            "visaExpiry": "2026-03-15",
            "visaStatus": "EXPIRING_SOON",
            "trafficLight": "RED",
            "daysRemaining": 28
          }
        ],
        "count": 1,
        "urgency": "RED"
      }
    ],
    "fimsDeadlines": [
      { "date": "2026-02-28", "type": "PERIODIC", "label": "2월 정기보고 마감" },
      { "date": "2026-05-31", "type": "PERIODIC", "label": "5월 정기보고 마감" }
    ],
    "summary": {
      "totalExpiring": 15,
      "within30Days": 5,
      "within60Days": 8,
      "within90Days": 15
    }
  }
}
```

Implementation:
- Auth required + `withRbac(session, 'student', 'read')`
- Filter by `universityId` + `isDeleted: false`
- For month view: query students whose `visaExpiry` falls within the requested month
- For week view: query students whose `visaExpiry` falls within the requested ISO week
- For list view: query students whose `visaExpiry` is within the next 30/60/90 days from today
- Group by date, compute urgency per date (worst status among students expiring that day)
- Include FIMS periodic report deadlines: Feb 28, May 31, Aug 31, Nov 30 (hardcoded for now — these are the FIMS quarterly deadlines)
- No PII in response
- Sort events by date ascending

---

## Task 2: Visa Expiry Calendar UI

Create the calendar page and components:

### 2-1. Calendar Page

`src/app/(dashboard)/calendar/page.tsx`
- Page title: "비자 만료 캘린더"
- View toggle buttons: 월간 / 주간 / 리스트
- Month/week navigation arrows (← 이전 / 다음 →)
- Current month/year display

### 2-2. Monthly View Component

`src/components/calendar/calendar-month.tsx`
- Standard calendar grid (7 columns × 5-6 rows)
- Day headers: 일/월/화/수/목/금/토
- Each date cell shows:
  - Date number
  - If students expire that day: colored badge with count
    - 🔴 Red badge: any student expiring within 30 days of today
    - 🟡 Yellow badge: any student expiring within 60 days of today
    - 🟢 Green badge: beyond 60 days
  - FIMS deadline marker: small indigo dot + tooltip "정기보고 마감"
- Click on a date → open a popover/modal showing the list of students expiring that day
  - Each student row: name, department, visa type, D-day
  - Click student → navigate to student detail page

### 2-3. Weekly View Component

`src/components/calendar/calendar-week.tsx`
- 7-column layout, one column per day
- Each day shows a list of students expiring that day:
  - Name (Korean)
  - Department
  - Visa type
  - Document request status badge (미요청 / 요청완료 / 서류수령 / 연장접수)
    - Note: For now, these statuses are display-only placeholders. The actual document tracking will come in a later phase. Default all to "미요청".
- Empty days show "만료 예정 학생 없음"

### 2-4. List View Component

`src/components/calendar/calendar-list.tsx`
- Filter tabs: 30일 이내 / 60일 이내 / 90일 이내 / 전체
- Sorted by visa expiry date (closest first)
- Table columns: 이름 | 학과 | 비자 유형 | 만료일 | D-Day | 상태
- D-Day column: "D-25" format with color coding (red ≤30, yellow ≤60, green >60)
- Click row → navigate to student detail

### 2-5. Calendar Zustand Store

`src/store/calendar-store.ts`

```typescript
interface CalendarStore {
  view: 'month' | 'week' | 'list';
  year: number;
  month: number;
  week: number;
  listFilter: '30' | '60' | '90' | 'all';
  events: CalendarEvent[];
  fimsDeadlines: FimsDeadline[];
  summary: CalendarSummary;
  isLoading: boolean;

  setView: (view: 'month' | 'week' | 'list') => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  setListFilter: (filter: '30' | '60' | '90' | 'all') => void;
  fetchCalendarData: () => Promise<void>;
}
```

---

## Task 3: Excel/CSV Import — File Upload + Parsing

### 3-1. Import Page

Create `src/app/(dashboard)/import/page.tsx`
- Page title: "데이터 가져오기"
- Description: "엑셀 또는 CSV 파일을 업로드하여 학생 데이터를 일괄 등록합니다."

### 3-2. File Upload Component

Create `src/components/import/file-upload.tsx`
- Drag-and-drop zone + file select button
- Accepted formats: .xlsx, .xls, .csv, .tsv
- Max file size: 50MB
- Show file name, size, type after selection
- "파일 제거" button to clear
- Multiple file upload support (for later merge functionality)
- Upload progress indicator
- Korean validation messages:
  - "지원하지 않는 파일 형식입니다. (.xlsx, .xls, .csv, .tsv만 가능)"
  - "파일 크기가 50MB를 초과합니다."

### 3-3. File Parsing API

Create `src/app/api/import/parse/route.ts`

POST /api/import/parse — Parses uploaded file and returns headers + preview data

Request: multipart/form-data with file
Response:
```json
{
  "success": true,
  "data": {
    "fileName": "students_2026.xlsx",
    "totalRows": 312,
    "headers": ["학생이름", "PASSPORT NO", "체류자격코드", "D-2 만료일", "수강현황(%)"],
    "preview": [
      ["왕밍", "M12345678", "D-2-2", "2026-09-15", "95"],
      ["Nguyen Thi Lan", "B98765432", "D-4-1", "2026-12-20", "88"]
    ],
    "previewRowCount": 5
  }
}
```

Implementation:
- Auth required + RBAC check (`student:create` permission)
- Use `xlsx` (SheetJS) library for parsing .xlsx/.xls files
- Use native parsing for .csv/.tsv (or use SheetJS for unified handling)
- Return first 5 rows as preview
- Return all headers (column names from first row)
- Do NOT store the file permanently — parse in memory
- Handle encoding issues (Korean Excel files may use EUC-KR)

**Note**: SheetJS (`xlsx` package) is not in the current tech stack. You need this for Excel parsing. It's a standard, widely-used library. Add it: `npm install xlsx`

### 3-4. Column Mapping Engine

Create `src/lib/column-mapper.ts`

A rule-based column mapping engine (no AI needed for v1 — pattern matching is sufficient for pilot):

```typescript
interface ColumnMapping {
  sourceColumn: string;      // Original column name from Excel
  targetField: string | null; // System field name, null if unmapped
  confidence: number;         // 0-100
  isManuallySet: boolean;
}

function autoMapColumns(headers: string[]): ColumnMapping[]
```

**Mapping Dictionary** (from spec §3.5):

| System Field | Recognized Patterns (Korean + English) |
|---|---|
| nameKr | 이름, 성명, 학생명, 한글이름, 한글성명 |
| nameEn | 영문이름, English Name, Name, 영문성명, 영문명 |
| nationality | 국적, Nationality, 국가, Country |
| passportNumber | 여권번호, Passport No., PASSPORT, 여권, Passport Number |
| visaType | 비자종류, 체류자격, Visa Type, 체류자격코드, 비자유형 |
| visaExpiry | 만료일, 체류기한, 비자만료, Visa Expiry, D-2만료일, 체류만료일 |
| enrollmentStatus | 학적상태, 재학여부, Status, 학적, 재학상태 |
| department | 학과, 소속학과, Department, 전공, 학부 |
| attendanceRate | 출석률, 출석, Attendance, 수강현황 |
| phone | 연락처, 전화번호, Phone, 핸드폰, 휴대폰, Mobile |
| email | 이메일, Email, E-mail, 메일 |
| address | 주소, 거주지, 체류지, Address, 주소지 |
| gpa | 학점, 성적, GPA, 평균학점, 평점 |
| studentId | 학번, Student ID, 학생번호 |
| arcNumber | 외국인등록번호, ARC, ARC Number, 등록번호 |
| insuranceStatus | 보험, 보험상태, Insurance, 건강보험 |

**Matching Rules**:
1. Exact match (case-insensitive, trim whitespace) → confidence 100
2. Contains match (header contains a pattern) → confidence 90
3. Partial/fuzzy match (Levenshtein distance or substring) → confidence 70-85
4. No match → confidence 0, targetField = null

Return confidence levels:
- 🟢 High (95+): exact or near-exact match
- 🟡 Medium (80-94): contains match
- 🔴 Low (<80): fuzzy match or unmapped

### 3-5. Column Mapping UI

Create `src/components/import/column-mapping.tsx`

Display after file is parsed:
- Table with columns: 엑셀 컬럼 | → | 시스템 필드 | 신뢰도
- Each row shows the auto-mapped result
- System field column: dropdown to manually change mapping
- Confidence badge: 🟢/🟡/🔴 with percentage
- Unmapped columns highlighted in red with "미매핑" label
- "매핑 확인" button to proceed to validation step
- "다시 매핑" button to reset to auto-mapped state

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
grep -rn "Loading\|Not found\|Error\|Submit\|Cancel\|Save\|Delete\|Search\|Filter\|No data\|No results\|Confirm\|Close\|Back\|Edit\|Create\|New\|View\|Upload\|Import\|Export\|Monday\|Tuesday\|Sunday\|January\|February" src/components/ src/app/ --include="*.tsx" | grep -v "node_modules" | grep -v "// " | grep -v "import" | grep -v "interface\|type \|enum " | grep -v ".test."
```
- [ ] 0 English text visible to users
- [ ] Calendar day headers in Korean (일/월/화/수/목/금/토)
- [ ] All button labels, tooltips, empty states in Korean
- [ ] Import page instructions and validation messages in Korean

### 4-3. Security
- [ ] Calendar API filters by universityId
- [ ] Calendar API has RBAC check
- [ ] No PII in calendar response
- [ ] Import parse API has RBAC check (student:create)
- [ ] Dashboard summary API now has RBAC check (Task 0 fix)
- [ ] Overstay rate is computed dynamically (Task 0 fix)

### 4-4. Spec Compliance
- [ ] Calendar: month/week/list views all render
- [ ] Calendar: date click shows student list popup
- [ ] Calendar: FIMS deadline markers shown (Feb/May/Aug/Nov)
- [ ] Calendar: color coding matches spec (🔴 ≤30d, 🟡 ≤60d, 🟢 >60d)
- [ ] Import: file upload accepts xlsx/xls/csv/tsv
- [ ] Import: column mapping shows confidence levels (🟢/🟡/🔴)
- [ ] Import: manual mapping override works
- [ ] API responses follow `{ success, data, error, meta }` format

**If all items PASS, Day 4 is complete. If any item FAILS, fix it and re-check.**
