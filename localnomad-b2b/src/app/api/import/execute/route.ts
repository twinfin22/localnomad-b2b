import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRbac } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { createAuditLog } from '@/lib/audit';
import type { ImportExecuteRequest, ImportExecutionResult } from '@/types';
import {
  VisaType,
  VisaStatus,
  EnrollmentStatus,
  ProgramType,
  InsuranceStatus,
} from '@prisma/client';

// Compute visa status based on days remaining until expiry
const computeVisaStatus = (visaExpiry: string): VisaStatus => {
  const expiry = new Date(visaExpiry);
  const now = new Date();
  const diffDays = Math.floor(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= 60) return 'EXPIRING_SOON';
  return 'ACTIVE';
};

// Build Prisma create/update data from a validated row
const buildStudentData = (
  data: Record<string, string | number | boolean | null>,
  encryptedPassport: string | null,
  encryptedArc: string | null,
  universityId: string,
  createdById: string
) => ({
  nameEn: data.nameEn as string,
  nameKr: (data.nameKr as string) || null,
  nationality: (data.nationality as string) || 'UNKNOWN',
  visaType: data.visaType as VisaType,
  visaExpiry: new Date(data.visaExpiry as string),
  visaStatus: computeVisaStatus(data.visaExpiry as string),
  enrollmentStatus: data.enrollmentStatus as EnrollmentStatus,
  programType: data.programType as ProgramType,
  department: data.department as string,
  semester: (data.semester as string) || null,
  attendanceRate: data.attendanceRate != null ? (data.attendanceRate as number) : null,
  gpa: data.gpa != null ? (data.gpa as number) : null,
  insuranceStatus: ((data.insuranceStatus as string) as InsuranceStatus) || 'NONE',
  insuranceExpiry: data.insuranceExpiry
    ? new Date(data.insuranceExpiry as string)
    : null,
  passportNumber: encryptedPassport,
  passportExpiry: data.passportExpiry
    ? new Date(data.passportExpiry as string)
    : null,
  arcNumber: encryptedArc,
  phone: (data.phone as string) || null,
  email: (data.email as string) || null,
  address: (data.address as string) || null,
  addressReported: false,
  partTimePermit: false,
  universityId,
  createdById,
});

// POST /api/import/execute — Execute validated import rows into the database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'import', 'create');
    if (rbacError) return rbacError;

    const user = session!.user;
    const body: ImportExecuteRequest = await request.json();
    const { fileName, validRows, duplicateRows, duplicateAction } = body;

    // Validate request body
    if (!fileName || !Array.isArray(validRows)) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다. 파일명과 데이터를 확인해주세요.' },
        { status: 400 }
      );
    }

    // Initialize counters
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let failed = 0;
    const errors: { rowIndex: number; error: string }[] = [];

    // Process valid rows — individual creates for per-row error isolation
    for (const row of validRows) {
      try {
        const { data } = row;

        // Encrypt PII fields
        const encryptedPassport = data.passportNumber
          ? encrypt(data.passportNumber as string)
          : null;
        const encryptedArc = data.arcNumber
          ? encrypt(data.arcNumber as string)
          : null;

        const createData = buildStudentData(
          data,
          encryptedPassport,
          encryptedArc,
          user.universityId,
          user.id
        );

        await prisma.student.create({ data: createData });
        imported++;
      } catch (error: unknown) {
        failed++;
        const errorMessage =
          error instanceof Error
            ? error.message
            : '학생 데이터 저장 중 오류가 발생했습니다.';
        errors.push({ rowIndex: row.rowIndex, error: errorMessage });
      }
    }

    // Process duplicate rows based on chosen action
    if (duplicateAction === 'skip' || duplicateAction === 'manual') {
      skipped += duplicateRows.length;
    } else if (duplicateAction === 'overwrite') {
      for (const row of duplicateRows) {
        try {
          const { data, duplicate } = row;

          if (!duplicate?.existingStudentId) {
            skipped++;
            continue;
          }

          // Encrypt PII fields
          const encryptedPassport = data.passportNumber
            ? encrypt(data.passportNumber as string)
            : null;
          const encryptedArc = data.arcNumber
            ? encrypt(data.arcNumber as string)
            : null;

          // Build update data (exclude universityId and createdById — those don't change on update)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { universityId: _uid, createdById: _cid, ...updateData } =
            buildStudentData(
              data,
              encryptedPassport,
              encryptedArc,
              user.universityId,
              user.id
            );

          await prisma.student.update({
            where: { id: duplicate.existingStudentId },
            data: updateData,
          });
          updated++;
        } catch (error: unknown) {
          failed++;
          const errorMessage =
            error instanceof Error
              ? error.message
              : '학생 데이터 업데이트 중 오류가 발생했습니다.';
          errors.push({ rowIndex: row.rowIndex, error: errorMessage });
        }
      }
    }

    // Record audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      resource: 'STUDENT',
      details: {
        type: 'IMPORT',
        fileName,
        imported,
        skipped,
        updated,
        failed,
      },
    });

    const result: ImportExecutionResult = {
      imported,
      skipped,
      updated,
      failed,
      errors,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : '임포트 실행 중 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
