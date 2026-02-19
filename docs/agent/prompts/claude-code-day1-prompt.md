# 로컬노마드 B2B 비자 대시보드 — Day 1 프로젝트 부트스트랩

## 프로젝트 개요
"로컬노마드"는 한국 대학교의 유학생 비자/체류 관리를 위한 B2B SaaS 대시보드입니다. 대학 국제교류처 담당자가 유학생의 비자 상태, FIMS(유학생정보시스템) 변동신고, 불법체류율(IEQAS) 등을 통합 관리하는 플랫폼입니다.

## 오늘(Day 1)의 목표
아래 5가지를 순서대로 완성해 주세요. 각 단계를 완료할 때마다 간단히 상태를 알려주세요.

---

## Task 1: Next.js 프로젝트 초기화

프로젝트 이름: `localnomad-b2b`

```bash
npx create-next-app@latest localnomad-b2b \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

추가 설치:
```bash
cd localnomad-b2b
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install zustand
npm install @tanstack/react-table
npm install lucide-react
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
npx shadcn@latest init -d
npx shadcn@latest add button card input label table dialog dropdown-menu avatar badge separator sheet tabs toast
```

---

## Task 2: 프로젝트 폴더 구조

아래 구조를 정확히 따라서 생성해 주세요:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # 사이드바 + 헤더 포함 레이아웃
│   │   ├── page.tsx              # 대시보드 메인 (요약 카드)
│   │   ├── students/
│   │   │   ├── page.tsx          # 학생 목록
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 학생 상세
│   │   ├── calendar/
│   │   │   └── page.tsx          # 비자 만료 캘린더
│   │   ├── fims/
│   │   │   └── page.tsx          # FIMS 변동신고 대기열
│   │   ├── import/
│   │   │   └── page.tsx          # 엑셀 임포트
│   │   ├── alerts/
│   │   │   └── page.tsx          # 알림 목록
│   │   └── settings/
│   │       └── page.tsx          # 설정
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── students/
│   │   │   ├── route.ts          # GET (목록), POST (생성)
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PUT, DELETE
│   │   ├── dashboard/
│   │   │   └── summary/
│   │   │       └── route.ts
│   │   └── universities/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx           # 좌측 사이드바 네비게이션
│   │   ├── header.tsx            # 상단 헤더 (유저 정보, 알림 아이콘)
│   │   └── mobile-nav.tsx
│   ├── students/
│   │   ├── student-table.tsx     # TanStack Table 기반 학생 목록
│   │   ├── student-detail.tsx    # 학생 상세 뷰
│   │   ├── student-form.tsx      # 학생 등록/수정 폼
│   │   └── traffic-light.tsx     # 상태 도트 컴포넌트
│   ├── dashboard/
│   │   ├── summary-cards.tsx     # 요약 카드 (상태별 카운트, IEQAS율)
│   │   └── recent-alerts.tsx
│   └── ui/                       # shadcn/ui 컴포넌트 (자동 생성됨)
├── lib/
│   ├── prisma.ts                 # Prisma 클라이언트 싱글턴
│   ├── auth.ts                   # NextAuth 설정
│   ├── crypto.ts                 # AES-256 암호화/복호화 유틸
│   └── utils.ts                  # 공통 유틸리티
├── store/
│   └── use-auth-store.ts         # Zustand 인증 상태
├── types/
│   └── index.ts                  # 공통 타입 정의
└── middleware.ts                  # 인증 미들웨어 (보호 라우트)
```

---

## Task 3: Prisma 스키마 정의

`prisma/schema.prisma` 파일을 아래 정의대로 작성해 주세요. **주석을 한글로** 달아주세요.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === ENUMS ===

enum IeqasStatus {
  CERTIFIED
  PENDING
  REVOKED
}

enum PlanType {
  FREE_TRIAL
  BASIC
  STANDARD
  PREMIUM
}

enum UserRole {
  ADMIN
  MANAGER
  VIEWER
}

enum VisaType {
  D_2_1  // 전문학사
  D_2_2  // 학사
  D_2_3  // 석사
  D_2_4  // 박사
  D_2_5  // 연구
  D_2_6  // 교환
  D_2_7  // 어학연수 동반
  D_2_8  // 단기과정
  D_4_1  // 어학연수
  D_4_7  // 기타연수
}

enum VisaStatus {
  ACTIVE
  EXPIRING_SOON    // 만료 60일 이내
  EXPIRED
  REVOKED
}

enum EnrollmentStatus {
  ENROLLED         // 재학
  ON_LEAVE         // 휴학
  EXPELLED         // 제적
  WITHDRAWN        // 자퇴
  GRADUATED        // 졸업
  UNREGISTERED     // 미등록
}

enum ProgramType {
  ASSOCIATE        // 전문학사
  BACHELOR         // 학사
  MASTER           // 석사
  DOCTORATE        // 박사
  LANGUAGE         // 어학연수
}

enum InsuranceStatus {
  ACTIVE
  EXPIRING
  EXPIRED
  NONE
}

enum FimsReportType {
  STATUS_CHANGE    // 변동신고
  PERIODIC         // 정기보고
}

enum FimsChangeType {
  ON_LEAVE         // 휴학
  EXPELLED         // 제적
  WITHDRAWN        // 자퇴
  GRADUATED        // 졸업
  UNREGISTERED     // 미등록
  TRANSFER         // 소속변경
}

enum FimsReportStatus {
  PENDING
  READY
  SUBMITTED
  OVERDUE
}

enum BatchVisaStatus {
  PREPARING
  READY
  SUBMITTED
  COMPLETED
}

enum AlertType {
  VISA_EXPIRY      // 비자 만료 임박
  ATTENDANCE_LOW   // 출석률 저조
  FIMS_DEADLINE    // 변동신고 기한 임박
  IEQAS_WARNING    // 불법체류율 경고
  INSURANCE_EXPIRY // 보험 만료
  DOCUMENT_REQUEST // 서류 요청
}

enum AlertChannel {
  IN_APP
  EMAIL
  KAKAO
  SMS
}

// === MODELS ===

model University {
  id                   String        @id @default(uuid())
  name                 String        @db.VarChar(200)        // 대학명
  region               String        @db.VarChar(50)         // 지역 (예: 충남 아산)
  ieqasStatus          IeqasStatus   @default(PENDING)       // IEQAS 인증 상태
  overstayRate         Decimal       @default(0) @db.Decimal(5, 2)  // 현재 불법체류율 (%)
  planType             PlanType      @default(FREE_TRIAL)    // 요금제
  contractStart        DateTime?     @db.Date                // 계약 시작일
  contractEnd          DateTime?     @db.Date                // 계약 종료일
  fimsTemplateVersion  String?       @db.VarChar(20)         // FIMS 양식 버전
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  users                User[]
  students             Student[]
  batchVisas           BatchVisaApplication[]

  @@map("universities")
}

model User {
  id              String     @id @default(uuid())
  universityId    String
  email           String     @unique @db.VarChar(200)   // 학교 이메일 (로그인용)
  name            String     @db.VarChar(100)           // 이름
  hashedPassword  String                                 // bcrypt 해시
  role            UserRole   @default(MANAGER)           // 권한
  isActive        Boolean    @default(true)              // 활성 여부
  lastLogin       DateTime?                              // 최근 로그인
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  university      University @relation(fields: [universityId], references: [id])
  studentsCreated Student[]  @relation("CreatedBy")
  fimsSubmitted   FimsReport[] @relation("SubmittedBy")
  batchVisas      BatchVisaApplication[] @relation("BatchCreatedBy")
  auditLogs       AuditLog[]

  @@map("users")
}

model Student {
  id                    String            @id @default(uuid())
  universityId          String
  nameKr                String?           @db.VarChar(100)     // 한글 이름
  nameEn                String            @db.VarChar(200)     // 영문 이름 (여권 기재)
  nationality           String            @db.VarChar(50)      // ISO 3166-1 국가코드
  passportNumber        String            @db.VarChar(200)     // AES-256 암호화 저장
  passportExpiry        DateTime          @db.Date
  arcNumber             String?           @db.VarChar(200)     // 외국인등록번호 (AES-256)
  visaType              VisaType
  visaExpiry            DateTime          @db.Date             // 체류 만료일
  visaStatus            VisaStatus        @default(ACTIVE)
  enrollmentStatus      EnrollmentStatus  @default(ENROLLED)
  programType           ProgramType
  department            String            @db.VarChar(100)     // 소속 학과
  semester              String?           @db.VarChar(20)      // 현재 학기
  attendanceRate        Decimal?          @db.Decimal(5, 2)    // 출석률 (%)
  gpa                   Decimal?          @db.Decimal(3, 2)    // 평균 학점
  insuranceStatus       InsuranceStatus   @default(NONE)
  insuranceExpiry       DateTime?         @db.Date
  address               String?           @db.Text             // 체류지 주소
  addressReported       Boolean           @default(false)      // 체류지 변경 신고 완료
  addressChangeDate     DateTime?         @db.Date
  partTimePermit        Boolean           @default(false)      // 시간제취업 허가
  partTimePermitExpiry  DateTime?         @db.Date
  phone                 String?           @db.VarChar(20)
  email                 String?           @db.VarChar(200)
  kakaoId               String?           @db.VarChar(100)     // 알림용
  emergencyContact      String?           @db.VarChar(200)
  photoUrl              String?           @db.VarChar(500)
  notes                 String?           @db.Text             // 담당자 메모
  isDeleted             Boolean           @default(false)      // soft delete
  createdById           String
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  university            University        @relation(fields: [universityId], references: [id])
  createdBy             User              @relation("CreatedBy", fields: [createdById], references: [id])
  fimsReports           FimsReport[]
  statusChanges         StatusChange[]
  alertLogs             AlertLog[]

  @@index([universityId])
  @@index([visaExpiry])
  @@index([visaStatus])
  @@index([enrollmentStatus])
  @@map("students")
}

model StatusChange {
  id          String            @id @default(uuid())
  studentId   String
  field       String            @db.VarChar(50)     // 변경된 필드명
  oldValue    String?           @db.Text            // 이전 값
  newValue    String?           @db.Text            // 새 값
  changedBy   String                                // 변경한 담당자 ID
  createdAt   DateTime          @default(now())

  student     Student           @relation(fields: [studentId], references: [id])

  @@index([studentId])
  @@map("status_changes")
}

model FimsReport {
  id            String            @id @default(uuid())
  studentId     String
  reportType    FimsReportType
  changeType    FimsChangeType?                        // 변동신고 시에만
  detectedAt    DateTime          @default(now())      // 변동 감지 시점
  deadline      DateTime          @db.Date             // 신고 기한 (감지일 + 15일)
  status        FimsReportStatus  @default(PENDING)
  submittedAt   DateTime?                              // FIMS 입력 완료 시점
  submittedById String?
  createdAt     DateTime          @default(now())

  student       Student           @relation(fields: [studentId], references: [id])
  submittedBy   User?             @relation("SubmittedBy", fields: [submittedById], references: [id])

  @@index([studentId])
  @@index([deadline])
  @@index([status])
  @@map("fims_reports")
}

model BatchVisaApplication {
  id              String          @id @default(uuid())
  universityId    String
  title           String          @db.VarChar(200)    // "2026년 1학기 단체접수"
  targetCount     Int             @default(0)         // 대상 학생 수
  readyCount      Int             @default(0)         // 준비 완료 수
  status          BatchVisaStatus @default(PREPARING)
  deadline        DateTime?       @db.Date            // 접수 마감일
  createdById     String
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  university      University      @relation(fields: [universityId], references: [id])
  createdBy       User            @relation("BatchCreatedBy", fields: [createdById], references: [id])

  @@map("batch_visa_applications")
}

model AlertLog {
  id          String       @id @default(uuid())
  studentId   String?
  userId      String?                              // 알림 대상 담당자
  type        AlertType
  channel     AlertChannel @default(IN_APP)
  title       String       @db.VarChar(200)
  message     String       @db.Text
  isRead      Boolean      @default(false)
  sentAt      DateTime     @default(now())
  readAt      DateTime?

  student     Student?     @relation(fields: [studentId], references: [id])
  user        User?        @relation(fields: [userId], references: [id])

  @@index([userId, isRead])
  @@index([studentId])
  @@map("alert_logs")
}

model ChatSession {
  id              String         @id @default(uuid())
  studentPhone    String?        @db.VarChar(20)
  studentKakaoId  String?        @db.VarChar(100)
  language        String         @db.VarChar(10)     // ko, en, zh, vi, uz, mn
  isEscalated     Boolean        @default(false)
  escalatedAt     DateTime?
  resolvedAt      DateTime?
  createdAt       DateTime       @default(now())

  messages        ChatMessage[]

  @@map("chat_sessions")
}

model ChatMessage {
  id          String       @id @default(uuid())
  sessionId   String
  role        String       @db.VarChar(20)     // user, assistant, staff
  content     String       @db.Text
  createdAt   DateTime     @default(now())

  session     ChatSession  @relation(fields: [sessionId], references: [id])

  @@index([sessionId])
  @@map("chat_messages")
}

model ImportJob {
  id              String        @id @default(uuid())
  universityId    String
  fileName        String        @db.VarChar(500)
  fileUrl         String?       @db.VarChar(1000)
  totalRows       Int           @default(0)
  successCount    Int           @default(0)
  errorCount      Int           @default(0)
  status          String        @db.VarChar(20)     // PENDING, PROCESSING, COMPLETED, FAILED
  columnMapping   Json?                              // AI 매핑 결과 JSON
  createdAt       DateTime      @default(now())
  completedAt     DateTime?

  errors          ImportError[]

  @@map("import_jobs")
}

model ImportError {
  id          String     @id @default(uuid())
  importJobId String
  rowNumber   Int
  field       String?    @db.VarChar(100)
  value       String?    @db.Text
  errorType   String     @db.VarChar(50)     // VALIDATION, DUPLICATE, FORMAT
  message     String     @db.Text
  createdAt   DateTime   @default(now())

  importJob   ImportJob  @relation(fields: [importJobId], references: [id])

  @@index([importJobId])
  @@map("import_errors")
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  action      String   @db.VarChar(50)      // CREATE, READ, UPDATE, DELETE, EXPORT, LOGIN
  resource    String   @db.VarChar(50)      // STUDENT, FIMS_REPORT, etc.
  resourceId  String?
  details     Json?                          // 변경 상세 (before/after)
  ipAddress   String?  @db.VarChar(50)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

Prisma 초기화 후 로컬 PostgreSQL이 없으면 SQLite로 개발용 설정을 해도 됩니다:
```bash
npx prisma init
# schema.prisma를 위 내용으로 교체
npx prisma generate
```

개발 환경에서는 `.env`에 아래 설정:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/localnomad?schema=public"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
AES_ENCRYPTION_KEY="dev-32-byte-key-change-in-prod!!"
```

---

## Task 4: 핵심 유틸리티 + 인증 모듈

### 4-1. Prisma 클라이언트 (`src/lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 4-2. AES-256 암호화 모듈 (`src/lib/crypto.ts`)

여권번호, 외국인등록번호 등 고유식별정보를 암호화/복호화합니다. `crypto` 내장 모듈 사용.

```typescript
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.AES_ENCRYPTION_KEY
  if (!key || key.length !== 32) {
    throw new Error('AES_ENCRYPTION_KEY must be exactly 32 bytes')
  }
  return Buffer.from(key, 'utf-8')
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // iv:tag:encrypted (hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, dataHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
```

### 4-3. NextAuth 설정 (`src/lib/auth.ts`)

Credentials Provider로 학교 이메일 + 비밀번호 인증. JWT 전략 사용.

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '학교 이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { university: true },
        })

        if (!user || !user.isActive) return null

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)
        if (!isValid) return null

        // 최근 로그인 시간 업데이트
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          universityId: user.universityId,
          universityName: user.university.name,
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8시간
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.universityId = (user as any).universityId
        token.universityName = (user as any).universityName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        (session.user as any).role = token.role
        (session.user as any).universityId = token.universityId
        (session.user as any).universityName = token.universityName
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
```

### 4-4. NextAuth API Route (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 4-5. 미들웨어 (`src/middleware.ts`)

```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### 4-6. 타입 정의 (`src/types/index.ts`)

NextAuth 세션 확장 타입, API 응답 타입 등을 정의해 주세요:

```typescript
import { UserRole } from '@prisma/client'

// NextAuth 세션 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      universityId: string
      universityName: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    universityId: string
    universityName: string
  }
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// 트래픽 라이트 상태
export type TrafficLightStatus = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'

export interface StudentWithStatus {
  trafficLight: TrafficLightStatus
  // ... Student 필드
}
```

---

## Task 5: 기본 레이아웃 UI

### 5-1. 대시보드 레이아웃 (`src/app/(dashboard)/layout.tsx`)

좌측 사이드바(240px) + 상단 헤더(64px) + 메인 콘텐츠 영역 구성.
반응형: 모바일에서는 사이드바 숨김, 햄버거 메뉴.

### 5-2. 사이드바 (`src/components/layout/sidebar.tsx`)

네비게이션 메뉴:
- 🏠 대시보드 (`/`)
- 👥 학생 관리 (`/students`)
- 📅 비자 캘린더 (`/calendar`)
- 📋 FIMS 관리 (`/fims`)
- 📥 데이터 임포트 (`/import`)
- 🔔 알림 (`/alerts`)
- ⚙️ 설정 (`/settings`)

하단: 대학명 표시 + 로그아웃 버튼.
lucide-react 아이콘 사용. 현재 경로에 active 스타일 적용.

### 5-3. 헤더 (`src/components/layout/header.tsx`)

- 좌측: 현재 페이지 제목 (breadcrumb)
- 우측: 알림 벨 아이콘 (unread count 배지) + 유저 아바타 + 드롭다운(프로필, 로그아웃)

### 5-4. 로그인 페이지 (`src/app/(auth)/login/page.tsx`)

- 심플한 센터 정렬 로그인 폼
- 로컬노마드 로고/텍스트 + "대학 국제교류처 전용"
- 학교 이메일 + 비밀번호 필드
- 로그인 버튼
- shadcn/ui Card, Input, Button, Label 사용

### 5-5. 대시보드 메인 페이지 (`src/app/(dashboard)/page.tsx`)

아직 실제 데이터 연결 불필요. 목업 데이터로 레이아웃만 구성:
- 요약 카드 4개: 전체 학생 수 / 비자 만료 임박 / 불법체류율 / 미확인 알림
- IEQAS 불법체류율 게이지 (기본 2%, 우수 1% 라인 표시)
- 최근 알림 리스트 (5건)

---

## 중요 규칙

1. **TypeScript strict mode** 사용
2. **한글 주석** 필수 (코드 내 모든 주석은 한글)
3. **shadcn/ui** 컴포넌트를 최대한 활용
4. **Tailwind** 유틸리티 클래스로 스타일링 (별도 CSS 파일 X)
5. 컬러 팔레트: Primary — indigo-600, Accent — emerald-500, Danger — red-500, Warning — amber-500
6. 폰트: Pretendard 웹폰트 (한글 지원)
7. 에러 처리: 모든 API route에 try-catch + 적절한 HTTP 상태 코드
8. `.env.example` 파일 생성해서 필요한 환경변수 목록 문서화

---

## 완료 확인

모든 Task를 마치면 아래 명령어로 빌드 확인:

```bash
npx prisma generate
npm run build
```

빌드 에러 0건이면 Day 1 완료입니다.
