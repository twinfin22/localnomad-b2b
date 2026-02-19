# LocalNomad B2B Visa Dashboard — Day 3: Dashboard Integration + Student List + Traffic Light

> **Prerequisites**: Day 1 (project init, Prisma schema, auth, layout) and Day 2 (RBAC, AuditLog, CRUD APIs, Seed Data) are complete.
> **Today's Goal**: Connect dashboard main to real APIs, implement TanStack Table-based student list view, and build the Traffic Light status engine.
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

## Task 1: Traffic Light Status Engine

Create `src/lib/traffic-light.ts`.

Implement the status determination logic exactly as defined in the spec (`docs/Phase1_프로덕트_스펙_v2.1.md` §3.3):

```typescript
// Status types
type TrafficLightStatus = 'BLACK' | 'RED' | 'YELLOW' | 'GREEN';

// Priority order (highest to lowest):
// 1. BLACK (no contact): No alert response in last 90 days + attendance rate 0%
// 2. RED (critical): Any of the following
//    - Visa expires within 30 days
//    - Enrollment status: EXPELLED / WITHDRAWN / UNREGISTERED
//    - Visa status: EXPIRED
//    - Attendance rate below 50%
//    - FIMS status change report deadline within 3 days
// 3. YELLOW (caution): Any of the following
//    - Visa expires within 60 days
//    - Enrollment status: ON_LEAVE
//    - Insurance status: EXPIRING or EXPIRED
//    - Attendance rate below 70%
//    - Address change unreported
//    - Part-time work permit expires within 30 days
//    - Pending FIMS status change report exists
// 4. GREEN (normal): None of the above conditions apply
```

Implementation requirements:
- `calculateTrafficLight(student, options?)` — Determine status for a single student
- `calculateTrafficLightBatch(students)` — Batch determination (for list view)
- Define the input data interface (`TrafficLightInput`)
- Return a `reasons` array explaining why the status was assigned (e.g., `['비자 만료 25일 이내', '출석률 45%']`)
- Reason messages must be in Korean
- **Pure function**: No DB access — determine status from input data only (testability)

---

## Task 2: Traffic Light API Endpoint

Create `src/app/api/students/traffic-light/route.ts`

GET /api/students/traffic-light — Returns traffic light status summary for all students

```json
{
  "success": true,
  "data": {
    "summary": {
      "GREEN": 35,
      "YELLOW": 8,
      "RED": 5,
      "BLACK": 2,
      "total": 50
    },
    "students": [
      {
        "id": "...",
        "nameKr": "왕밍",
        "nameEn": "Wang Ming",
        "status": "RED",
        "reasons": ["비자 만료 25일 이내", "출석률 45%"],
        "department": "컴퓨터공학과",
        "visaExpiry": "2026-03-12",
        "enrollmentStatus": "ENROLLED"
      }
    ]
  }
}
```

Important:
- Filter by `isDeleted: false` + `universityId` (required)
- No PII in response (exclude passportNumber, arcNumber)
- Auth required
- Sort students by severity: BLACK → RED → YELLOW → GREEN

---

## Task 3: Dashboard Main — Real API Integration

The current `src/components/dashboard/summary-cards.tsx` and `src/components/dashboard/recent-alerts.tsx` use mock data. Connect them to real APIs.

### 3-1. SummaryCards Component Update

Call `GET /api/dashboard/summary` API to display real data:
- Total student count
- Visa status counts (ACTIVE / EXPIRING_SOON / EXPIRED / REVOKED)
- IEQAS overstay rate gauge
- Upcoming visa expiry counts (30-day / 60-day / 90-day windows)

### 3-2. Traffic Light Summary Cards

Call `GET /api/students/traffic-light` API to display:
- Status counts (🟢 정상 / 🟡 주의 / 🔴 긴급 / ⚫ 연락두절)
- Each card clickable → navigates to student list filtered by that status (`/students?trafficLight=RED`)

### 3-3. RecentAlerts Component Update

Create a new `GET /api/alerts` endpoint and connect:
- Show 10 most recent alerts for the current university
- Distinct icons/colors per AlertType (VISA_EXPIRY, ATTENDANCE, FIMS_DEADLINE, INSURANCE, GENERAL)
- Read/unread status indicator
- "전체 보기" (View All) link → navigates to `/alerts`

Create `src/app/api/alerts/route.ts`:
- GET: Recent alerts list (supports page, limit, isRead filters)
- Must filter by `universityId`
- Auth required

### 3-4. IEQAS Overstay Rate Gauge — Dynamic

Replace the current hardcoded value (1.8%) with real data:
- IEQAS overstay rate = (expired + unregistered + expelled with unknown whereabouts) / total × 100
- Show threshold lines: Excellent certification (1%) / Basic certification (2%)
- Auto-change color based on current value (green / yellow / red)

---

## Task 4: Student List Page — TanStack Table

Implement `src/app/(dashboard)/students/page.tsx` and related components.

### 4-1. Student List Table

Create `src/components/students/student-table.tsx`

TanStack Table-based student list:
- Default columns: Traffic Light dot | Name (Korean/English) | Nationality | Department | Visa Type | Visa Expiry | Enrollment Status | Visa Status | Insurance Status | Attendance Rate
- Column resize enabled
- Column visibility toggle
- Sorting (click column header)
- Row click → open student detail slide panel (implemented in Task 5)
- Pagination (bottom page navigator)
- Optimized for minimum width 1280px

TanStack Table configuration:
- Server-side pagination (fetch page data from API)
- Persist column size state
- Empty state message in Korean: "등록된 학생이 없습니다."

### 4-2. Search + Filter Bar

Create `src/components/students/student-filters.tsx`

Search + filter bar above the table:
- Search: Name (Korean/English) text search with 300ms debounce
- Filter dropdowns:
  - Traffic Light status (전체/정상/주의/긴급/연락두절)
  - Visa status (전체/유효/만료임박/만료/취소)
  - Enrollment status (전체/재학/휴학/제적/자퇴/졸업/미등록)
  - Visa type (전체/D-2-2/D-2-3/D-4-1/...)
  - Department (전체 + department list)
- Filter reset button
- Sync with URL query parameters (e.g., `/students?search=왕&visaStatus=EXPIRING_SOON&trafficLight=RED`)

### 4-3. Student List Zustand Store

Create `src/store/student-store.ts`

```typescript
interface StudentStore {
  // Student list
  students: Student[];
  total: number;
  isLoading: boolean;

  // Pagination
  page: number;
  limit: number;

  // Filters
  filters: {
    search: string;
    visaStatus: string;
    enrollmentStatus: string;
    visaType: string;
    department: string;
    trafficLight: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };

  // Actions
  fetchStudents: () => Promise<void>;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  resetFilters: () => void;
}
```

---

## Task 5: Student Detail Slide Panel

Create `src/components/students/student-detail-panel.tsx`

A slide-in panel that opens from the right when a row is clicked in the student list:

### 5-1. Left Section: Basic Info
- Traffic Light status badge + reason list
- Basic info: name, nationality, department, student ID, visa type, visa expiry
- Contact: phone, email, KakaoTalk
- PII (MANAGER/ADMIN only): passport number (masked by default, "전체 보기" button → click to decrypt + AuditLog)
- Academic info: enrollment status, attendance rate, GPA
- Insurance info: insurance status, expiry date
- Address: current address, address change reported status

### 5-2. Right or Bottom Section: Timeline
- Recent alert history (AlertLog)
- Enrollment status change history (StatusChange)
- FIMS report history (FimsReport)
- Reverse chronological order
- Each item shows date + brief description

### 5-3. Action Buttons
- "수정" (Edit) button — MANAGER/ADMIN only
- "삭제" (Delete) button — ADMIN only — with confirmation dialog + soft delete

### 5-4. Enhance Student Detail API

Modify `src/app/api/students/[id]/route.ts` GET response to include:
- `trafficLight`: The student's traffic light status + reasons
- `timeline`: Recent StatusChange, AlertLog, FimsReport merged and sorted by time (latest 20 items)

---

## Task 6: Student Create/Edit Form

Create `src/components/students/student-form.tsx`

A shared form component for both new student registration and editing existing students:

### 6-1. Form Fields
- Basic info: Name (Korean), Name (English, required), Nationality (required), Department (required), Student ID
- Visa info: Visa type (required), Visa expiry (required), Visa status
- Academic info: Enrollment status (required), Program type (required), Semester, Attendance rate, GPA
- PII (optional): Passport number (optional — until 위탁계약 is signed), Passport expiry (optional), ARC number (optional)
- Insurance: Insurance status, Insurance expiry
- Contact: Phone, Email, KakaoTalk ID, Emergency contact
- Address: Address, Address change reported, Change date
- Other: Notes

### 6-2. Validation
- Required fields: show Korean error messages when empty
- Visa expiry: allow past dates (for registering already-expired students)
- Passport number format: validate per nationality pattern (optional field, so empty value is allowed)

### 6-3. Create/Edit Behavior
- New student: POST /api/students → on success, navigate to list + toast notification
- Edit: PUT /api/students/:id → on success, refresh detail panel + toast notification
- Use shadcn/ui Toast component
- MANAGER and ADMIN only

### 6-4. Registration Page

Create `src/app/(dashboard)/students/new/page.tsx` — New student registration page
- Title at top: "새 학생 등록"
- Use student-form component
- Back button → `/students`

---

## Task 7: Verification Checklist

After all Tasks are complete, **run** the following checks and output the results.

### 7-1. Build
```bash
npm run build
```
- [ ] 0 build errors
- [ ] 0 new TypeScript `any` types introduced

### 7-2. UX (Korean UI)
```bash
grep -rn "Loading\|Not found\|Error\|Submit\|Cancel\|Save\|Delete\|Search\|Filter\|No data\|No results" src/components/ src/app/ --include="*.tsx" | grep -v "node_modules" | grep -v "// " | grep -v "import" | grep -v "interface\|type "
```
- [ ] 0 English text strings visible to users (all user-facing text must be Korean)
- [ ] Error messages are in Korean and user-friendly
- [ ] Empty state messages are in Korean (e.g., "등록된 학생이 없습니다.")

### 7-3. Security & Legal
```bash
grep -rn "passportNumber\|arcNumber" src/app/api/ src/components/ --include="*.ts" --include="*.tsx" | grep -v "encrypt\|decrypt\|select.*false\|Encrypted\|masked\|omit\|exclude\|PII\|audit\|interface\|type "
```
- [ ] PII is never exposed in the list view
- [ ] PII decryption only occurs in detail view, accompanied by AuditLog
- [ ] All API calls include `universityId` filter
- [ ] RBAC checks exist for create/edit/delete operations

### 7-4. Traffic Light Logic
- [ ] Priority order is correct: BLACK > RED > YELLOW > GREEN
- [ ] Threshold values match the spec (30/60 days, 50%/70%, etc.)
- [ ] `reasons` array returns messages in Korean

### 7-5. Spec Compliance
- [ ] API responses follow `{ success, data, error, meta }` format
- [ ] TanStack Table uses server-side pagination
- [ ] Filter state is synced with URL query parameters

**If all items PASS, Day 3 is complete. If any item FAILS, fix it and re-check.**
