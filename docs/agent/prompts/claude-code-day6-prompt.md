# LocalNomad B2B Visa Dashboard — Day 6: W2 Gate Tests + Notification System Backend

> **Prerequisites**: Day 1-5 complete. W2 features (dashboard, student CRUD, calendar, import) all implemented. Now we close out W2 testing gaps and begin W3.
> **Today's Goal**: (1) Write W2 Gate tests (traffic light unit tests, 1,000-record seed + performance, import E2E). (2) Build notification system backend (scheduler + alert engine).
> **Reference**: Read `CLAUDE.md` and `docs/Phase1_프로덕트_스펙_v2.1.md` (§3.10, §4) first.

---

## ⚠️ Decision-Making Rules (Must Follow)

The founder may be unavailable while this prompt is running. Follow the Decision-Making Rules in `CLAUDE.md`:

### Decide on your own (don't ask):
- Library/package version choices, import ordering, code formatting
- File/folder naming within established conventions
- Error message wording (must be in Korean, user-friendly)
- UI spacing, padding, column widths — minor adjustments within the design system
- Build errors, lint fixes
- Test framework choice (Vitest recommended — fast, TypeScript-native, works with Next.js)

### Must stop and wait:
- Adding new packages/dependencies not in the tech stack
- DB schema changes
- Auth/authorization logic changes
- Encryption or PII handling changes
- Deviating from the spec
- API response format or endpoint structure changes

If blocked → document the question clearly → move on to the next independent Task.

---

## Task 1: Testing Infrastructure Setup

Set up testing infrastructure for the project.

### 1-1. Install Vitest

Install Vitest as the test runner (lightweight, fast, TypeScript-native):

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts` at the project root:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Add to `package.json` scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Task 2: Traffic Light Unit Tests

Create `src/lib/__tests__/traffic-light.test.ts`

Write comprehensive unit tests for the traffic light engine. Each test should verify the status AND the Korean reason messages.

### Required Test Cases (minimum 15):

**GREEN status:**
1. Student with all normal values → GREEN, reason: "정상"
2. Student with visa expiry 90 days away, 85% attendance, ENROLLED → GREEN

**RED status:**
3. Visa expiry within 30 days → RED, reason includes "비자 만료"
4. Visa already expired (past date) → RED
5. Enrollment status EXPELLED → RED, reason includes "제적"
6. Enrollment status WITHDRAWN → RED, reason includes "자퇴"
7. Enrollment status UNREGISTERED → RED, reason includes "미등록"
8. Visa status EXPIRED → RED
9. Attendance rate below 50% (e.g., 45%) → RED, reason includes "출석률"
10. FIMS deadline within 3 days → RED, reason includes "FIMS"

**YELLOW status:**
11. Visa expiry between 31-60 days → YELLOW, reason includes "비자 만료"
12. Enrollment status ON_LEAVE → YELLOW, reason includes "휴학"
13. Insurance status EXPIRING → YELLOW, reason includes "보험"
14. Attendance rate between 50-69% → YELLOW
15. Address change unreported → YELLOW, reason includes "체류지"

**Priority tests:**
16. Student with BOTH red and yellow conditions → should be RED (not YELLOW)
17. Student with multiple RED reasons → all reasons listed

**Batch test:**
18. `calculateTrafficLightBatch()` with 5 students → correct status distribution

**Edge cases:**
19. Student with null attendance rate → should not trigger attendance-related status
20. Student with null visa expiry → handle gracefully (should not crash)

Run tests and confirm all pass:
```bash
npm run test
```

---

## Task 3: 1,000-Record Seed Data + Performance Test

### 3-1. Large Seed Script

Create `prisma/seed-large.ts`

Generate 1,000 students with realistic distribution:

**Nationality distribution** (matching real data):
- Vietnam (VN): 30% = 300 students
- China (CN): 30% = 300 students
- Uzbekistan (UZ): 10% = 100 students
- Mongolia (MN): 10% = 100 students
- Others (NP, BD, PH, ID, KH, MM): 20% = 200 students

**Visa status distribution:**
- ACTIVE: 70% = 700
- EXPIRING_SOON: 15% = 150
- EXPIRED: 10% = 100
- REVOKED: 5% = 50

**Enrollment status distribution:**
- ENROLLED: 75% = 750
- ON_LEAVE: 10% = 100
- GRADUATED: 5% = 50
- EXPELLED: 3% = 30
- WITHDRAWN: 3% = 30
- UNREGISTERED: 4% = 40

**Traffic light expected distribution** (approximate):
- GREEN: ~55-65%
- YELLOW: ~20-25%
- RED: ~15-20%

**Other fields:**
- Randomized departments (10 different departments)
- Visa types: D_2_2, D_2_3, D_2_6, D_4_1, D_4_7 (weighted)
- Attendance rates: normal distribution centered at 85%, range 0-100
- GPA: normal distribution centered at 3.2, range 1.5-4.5
- Visa expiry dates: spread from 30 days ago to 365 days from now
- 80% have passportNumber (encrypted), 60% have arcNumber (encrypted)
- Insurance statuses: ACTIVE 70%, EXPIRING 10%, EXPIRED 10%, NONE 10%

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Also add a separate command:
```json
{
  "seed:large": "npx tsx prisma/seed-large.ts"
}
```

The script should:
1. Clear existing student data (soft delete or truncate for test DB)
2. Use the same university and users from the original seed
3. Generate 1,000 students with `prisma.student.createMany()` for performance
4. Encrypt PII fields using the same `encrypt()` utility
5. Log generation time and counts

### 3-2. Performance Test Script

Create `scripts/performance-test.ts`

A script that measures API response times:

```typescript
// Test 1: Student list (page 1, limit 20) — target: <500ms
// Test 2: Student list (page 1, limit 100) — target: <1000ms
// Test 3: Traffic light summary — target: <2000ms
// Test 4: Dashboard summary — target: <1000ms
// Test 5: Calendar month view — target: <1000ms
// Test 6: Student list with traffic light filter — target: <3000ms
```

For each test:
- Make HTTP request to localhost:3000/api/...
- Measure response time
- Check response status code
- Log: endpoint, response time, pass/fail against target
- Repeat 3 times and report average

Add to `package.json`:
```json
{
  "perf:test": "npx tsx scripts/performance-test.ts"
}
```

**Note**: This requires the dev server to be running. The script should check if localhost:3000 is accessible first.

---

## Task 4: Notification System Backend — Alert Scheduler

Build the backend for the multi-tier notification system (spec §3.10).

### 4-1. Alert Engine

Create `src/lib/alert-engine.ts`

A function that scans all students and generates alerts based on rules:

```typescript
interface AlertRule {
  type: AlertType;          // VISA_EXPIRY, ATTENDANCE, FIMS_DEADLINE, INSURANCE, GENERAL
  condition: (student: StudentWithRelations) => boolean;
  message: (student: StudentWithRelations) => string;
  channels: AlertChannel[]; // IN_APP, EMAIL, KAKAO, SMS
  target: 'staff' | 'student' | 'both';
  priority: 'urgent' | 'normal';
}
```

**Alert rules to implement** (from spec §3.10):

| Alert Type | Condition | Channels | Target |
|---|---|---|---|
| VISA_EXPIRY (90d) | visaExpiry within 90 days | IN_APP, EMAIL | staff |
| VISA_EXPIRY (60d) | visaExpiry within 60 days | IN_APP, EMAIL, KAKAO | both |
| VISA_EXPIRY (30d) | visaExpiry within 30 days | IN_APP, EMAIL, KAKAO | both |
| VISA_EXPIRY (14d) | visaExpiry within 14 days | IN_APP, EMAIL, KAKAO, SMS | both |
| VISA_EXPIRY (7d) | visaExpiry within 7 days | IN_APP, EMAIL, KAKAO, SMS | both |
| ATTENDANCE | attendanceRate < 70% | IN_APP, EMAIL | staff |
| FIMS_DEADLINE (7d) | pending FIMS report, deadline ≤7 days | IN_APP, EMAIL, KAKAO | staff |
| FIMS_DEADLINE (3d) | pending FIMS report, deadline ≤3 days | IN_APP, EMAIL, KAKAO | staff |
| INSURANCE | insuranceExpiry within 30 days | IN_APP, EMAIL, KAKAO | both |

**Implementation:**
- `generateAlerts(universityId)` — scans all students in a university and returns new alerts
- **Deduplication**: Don't create duplicate alerts. Check if an alert of the same type for the same student was already created within the last 7 days.
- Return array of `AlertLog` objects ready for DB insert
- All alert messages in Korean for staff, in student's language (based on nationality) for students (for now, Korean only — multilingual in W4)
- Pure function that returns alerts without side effects (DB insert done by caller)

### 4-2. Alert Scheduler API

Create `src/app/api/alerts/generate/route.ts`

POST /api/alerts/generate — Runs the alert engine and creates new alerts in DB.

This endpoint will be called by a cron job (or manually by admin for testing).

Behavior:
1. Auth required + ADMIN only (this is an admin action)
2. Call `generateAlerts(universityId)` from the alert engine
3. Insert new alerts into AlertLog table via `prisma.alertLog.createMany()`
4. Return summary: `{ generated: 15, skipped: 5 (duplicates) }`

### 4-3. Alert Notification Service

Create `src/lib/notification-service.ts`

A service that handles sending alerts through different channels:

```typescript
interface NotificationService {
  sendInApp(alert: AlertLog): Promise<void>;    // Already handled by DB insert
  sendEmail(alert: AlertLog): Promise<void>;    // Placeholder for AWS SES
  sendKakao(alert: AlertLog): Promise<void>;    // Placeholder for Kakao BizMessage
  sendSMS(alert: AlertLog): Promise<void>;      // Placeholder for SMS gateway
}
```

For Phase 1 Day 6, implement:
- **IN_APP**: Already done — creating AlertLog record IS the in-app notification
- **EMAIL**: Create a placeholder that logs the email details (recipient, subject, body) to console. Add a `TODO: Integrate AWS SES` comment. The actual integration will come when we set up AWS infrastructure.
- **KAKAO**: Create a placeholder that logs to console. Add `TODO: Integrate Kakao BizMessage API` comment.
- **SMS**: Create a placeholder that logs to console. Add `TODO: Integrate SMS gateway` comment.

Each placeholder should:
- Accept the alert data
- Format the message content (Korean)
- Log: `[EMAIL] To: kim@hoseo.edu | Subject: 비자 만료 알림 | ...`
- Return successfully (don't throw)

### 4-4. Alert Settings API

Create `src/app/api/alerts/settings/route.ts`

GET /api/alerts/settings — Returns current alert settings for the university
PUT /api/alerts/settings — Updates alert settings

For now, return hardcoded default settings (the AlertSettings table likely doesn't exist yet — use in-memory defaults):

```json
{
  "success": true,
  "data": {
    "visaExpiryAlerts": true,
    "visaExpiryDays": [90, 60, 30, 14, 7],
    "attendanceAlerts": true,
    "attendanceThreshold": 70,
    "fimsDeadlineAlerts": true,
    "fimsDeadlineDays": [7, 3, 1],
    "insuranceAlerts": true,
    "insuranceDays": [30, 14],
    "emailEnabled": true,
    "kakaoEnabled": false,
    "smsEnabled": false
  }
}
```

**Note**: If this requires a schema change to store settings, use in-memory defaults and add a `TODO: Add AlertSettings model to schema` comment. Do NOT modify the schema.

---

## Task 5: In-App Notification UI

### 5-1. Notification Panel

Create `src/components/alerts/notification-panel.tsx`

A dropdown panel in the header that shows recent notifications:

- Bell icon with unread count badge (red dot with number)
- Click to open dropdown panel
- Shows latest 10 alerts
- Each alert: icon (by type) + message + time ago (e.g., "3시간 전")
- Click individual alert → mark as read + navigate to relevant page
  - VISA_EXPIRY → student detail page
  - ATTENDANCE → student detail page
  - FIMS_DEADLINE → /fims page
  - INSURANCE → student detail page
- "모두 읽음" button to mark all as read
- "전체 보기" link → /alerts page

### 5-2. Alerts Page

Update `src/app/(dashboard)/alerts/page.tsx` (currently a placeholder)

Full alerts management page:
- Page title: "알림"
- Filter tabs: 전체 / 미확인 / 확인완료
- Filter by alert type dropdown
- Table: 유형 | 내용 | 대상 학생 | 채널 | 발송일 | 상태
- Click row → navigate to relevant student/page
- Bulk actions: "선택한 알림 읽음 처리"
- Pagination

### 5-3. Update Header Component

Update the header/nav component to include the notification bell with the NotificationPanel.

### 5-4. Mark Read API

Create `src/app/api/alerts/[id]/read/route.ts`

PUT /api/alerts/:id/read — Mark a single alert as read
- Set `isRead: true` on the AlertLog record
- Auth required
- Return updated alert

Also create `src/app/api/alerts/read-all/route.ts`

PUT /api/alerts/read-all — Mark all alerts as read for current user
- Auth required
- Update all unread alerts for the user's university

---

## Task 6: Verification Checklist

After all Tasks are complete, **run** the following checks and output the results.

### 6-1. Build
```bash
cd localnomad-b2b && npm run build
```
- [ ] 0 build errors

### 6-2. Tests
```bash
cd localnomad-b2b && npm run test
```
- [ ] All traffic light unit tests pass (15+ test cases)
- [ ] Test coverage for traffic-light.ts functions

### 6-3. Seed + Performance (if dev server is running)
```bash
cd localnomad-b2b && npm run seed:large
# Then with dev server running:
cd localnomad-b2b && npm run perf:test
```
- [ ] 1,000 students seeded successfully
- [ ] Student list API < 500ms (limit 20)
- [ ] Traffic light summary API < 2000ms
- [ ] Dashboard summary API < 1000ms

### 6-4. Korean UI
- [ ] Notification panel all Korean text
- [ ] Alerts page all Korean text
- [ ] Alert messages generated in Korean

### 6-5. Security
- [ ] Alert generate API restricted to ADMIN
- [ ] Alert read APIs have auth check
- [ ] universityId filtering on all alert queries
- [ ] No PII in alert messages

### 6-6. Spec Compliance
- [ ] Alert rules match spec §3.10 (visa 90/60/30/14/7d, attendance, FIMS, insurance)
- [ ] Deduplication prevents duplicate alerts (7-day window)
- [ ] Notification channels: IN_APP working, EMAIL/KAKAO/SMS are placeholders with proper logging
- [ ] Alert settings API returns sensible defaults

**If all items PASS, Day 6 is complete. If any item FAILS, fix it and re-check.**
