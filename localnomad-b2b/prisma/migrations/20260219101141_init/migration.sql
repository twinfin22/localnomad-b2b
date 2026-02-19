-- CreateEnum
CREATE TYPE "IeqasStatus" AS ENUM ('CERTIFIED', 'PENDING', 'REVOKED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE_TRIAL', 'BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "VisaType" AS ENUM ('D_2_1', 'D_2_2', 'D_2_3', 'D_2_4', 'D_2_5', 'D_2_6', 'D_2_7', 'D_2_8', 'D_4_1', 'D_4_7');

-- CreateEnum
CREATE TYPE "VisaStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'ON_LEAVE', 'EXPELLED', 'WITHDRAWN', 'GRADUATED', 'UNREGISTERED');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'LANGUAGE');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'NONE');

-- CreateEnum
CREATE TYPE "FimsReportType" AS ENUM ('STATUS_CHANGE', 'PERIODIC');

-- CreateEnum
CREATE TYPE "FimsChangeType" AS ENUM ('ON_LEAVE', 'EXPELLED', 'WITHDRAWN', 'GRADUATED', 'UNREGISTERED', 'TRANSFER');

-- CreateEnum
CREATE TYPE "FimsReportStatus" AS ENUM ('PENDING', 'READY', 'SUBMITTED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "BatchVisaStatus" AS ENUM ('PREPARING', 'READY', 'SUBMITTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('VISA_EXPIRY', 'ATTENDANCE_LOW', 'FIMS_DEADLINE', 'IEQAS_WARNING', 'INSURANCE_EXPIRY', 'DOCUMENT_REQUEST', 'CHAT_ESCALATION');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('IN_APP', 'EMAIL', 'KAKAO', 'SMS');

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "region" VARCHAR(50) NOT NULL,
    "ieqasStatus" "IeqasStatus" NOT NULL DEFAULT 'PENDING',
    "overstayRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "planType" "PlanType" NOT NULL DEFAULT 'FREE_TRIAL',
    "contractStart" DATE,
    "contractEnd" DATE,
    "fimsTemplateVersion" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "nameKr" VARCHAR(100),
    "nameEn" VARCHAR(200) NOT NULL,
    "nationality" VARCHAR(50) NOT NULL,
    "passportNumber" VARCHAR(200),
    "passportExpiry" DATE,
    "arcNumber" VARCHAR(200),
    "visaType" "VisaType" NOT NULL,
    "visaExpiry" DATE NOT NULL,
    "visaStatus" "VisaStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "programType" "ProgramType" NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "semester" VARCHAR(20),
    "attendanceRate" DECIMAL(5,2),
    "gpa" DECIMAL(3,2),
    "insuranceStatus" "InsuranceStatus" NOT NULL DEFAULT 'NONE',
    "insuranceExpiry" DATE,
    "address" TEXT,
    "addressReported" BOOLEAN NOT NULL DEFAULT false,
    "addressChangeDate" DATE,
    "partTimePermit" BOOLEAN NOT NULL DEFAULT false,
    "partTimePermitExpiry" DATE,
    "phone" VARCHAR(20),
    "email" VARCHAR(200),
    "kakaoId" VARCHAR(100),
    "emergencyContact" VARCHAR(200),
    "photoUrl" VARCHAR(500),
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_changes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "field" VARCHAR(50) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fims_reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reportType" "FimsReportType" NOT NULL,
    "changeType" "FimsChangeType",
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATE NOT NULL,
    "status" "FimsReportStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fims_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_visa_applications" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "readyCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BatchVisaStatus" NOT NULL DEFAULT 'PREPARING',
    "deadline" DATE,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_visa_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "userId" TEXT,
    "type" "AlertType" NOT NULL,
    "channel" "AlertChannel" NOT NULL DEFAULT 'IN_APP',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "studentPhone" VARCHAR(20),
    "studentKakaoId" VARCHAR(100),
    "language" VARCHAR(10) NOT NULL,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "intent" VARCHAR(50),
    "confidence" DOUBLE PRECISION,
    "language" VARCHAR(10),
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "fileUrl" VARCHAR(1000),
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL,
    "columnMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_errors" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "field" VARCHAR(100),
    "value" TEXT,
    "errorType" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "students_universityId_idx" ON "students"("universityId");

-- CreateIndex
CREATE INDEX "students_visaExpiry_idx" ON "students"("visaExpiry");

-- CreateIndex
CREATE INDEX "students_visaStatus_idx" ON "students"("visaStatus");

-- CreateIndex
CREATE INDEX "students_enrollmentStatus_idx" ON "students"("enrollmentStatus");

-- CreateIndex
CREATE INDEX "status_changes_studentId_idx" ON "status_changes"("studentId");

-- CreateIndex
CREATE INDEX "fims_reports_studentId_idx" ON "fims_reports"("studentId");

-- CreateIndex
CREATE INDEX "fims_reports_deadline_idx" ON "fims_reports"("deadline");

-- CreateIndex
CREATE INDEX "fims_reports_status_idx" ON "fims_reports"("status");

-- CreateIndex
CREATE INDEX "alert_logs_userId_isRead_idx" ON "alert_logs"("userId", "isRead");

-- CreateIndex
CREATE INDEX "alert_logs_studentId_idx" ON "alert_logs"("studentId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "import_errors_importJobId_idx" ON "import_errors"("importJobId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_changes" ADD CONSTRAINT "status_changes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fims_reports" ADD CONSTRAINT "fims_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fims_reports" ADD CONSTRAINT "fims_reports_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_visa_applications" ADD CONSTRAINT "batch_visa_applications_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_visa_applications" ADD CONSTRAINT "batch_visa_applications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_logs" ADD CONSTRAINT "alert_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_logs" ADD CONSTRAINT "alert_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "import_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
