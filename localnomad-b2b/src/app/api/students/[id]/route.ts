import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac, checkPermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/crypto';
import type { ApiResponse } from '@/types';

// Next.js 16: params is an async Promise
type RouteParams = { params: Promise<{ id: string }> };

// Fields tracked for StatusChange records
const TRACKED_FIELDS = [
  'enrollmentStatus',
  'visaStatus',
  'visaType',
  'department',
] as const;

// Mask PII value: show first 2 characters + "****"
const maskPii = (value: string): string => {
  if (value.length <= 2) return '****';
  return value.slice(0, 2) + '****';
};

// GET /api/students/:id — Student detail with conditional PII decryption
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'read');
    if (rbacError) return rbacError;
    const user = session!.user;

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: {
        id,
        universityId: user.universityId,
        isDeleted: false,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    // Determine PII access level based on role
    const canReadPii = checkPermission(user.role, 'student_pii', 'read');

    let passportDisplay: string;
    let arcDisplay: string | null;

    if (canReadPii) {
      // ADMIN or MANAGER: decrypt and expose PII
      passportDisplay = decrypt(student.passportNumber);
      arcDisplay = student.arcNumber ? decrypt(student.arcNumber) : null;

      // Audit log for PII access
      void createAuditLog({
        userId: user.id,
        action: 'READ',
        resource: 'STUDENT_PII',
        resourceId: student.id,
      });
    } else {
      // VIEWER: mask PII
      try {
        passportDisplay = maskPii(decrypt(student.passportNumber));
      } catch {
        passportDisplay = '****';
      }
      arcDisplay = student.arcNumber
        ? (() => {
            try {
              return maskPii(decrypt(student.arcNumber));
            } catch {
              return '****';
            }
          })()
        : null;
    }

    // Replace encrypted values with display values
    const { passportNumber: _pp, arcNumber: _arc, ...rest } = student;
    const responseData = {
      ...rest,
      passportNumber: passportDisplay,
      arcNumber: arcDisplay,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    } satisfies ApiResponse<typeof responseData>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '학생 정보 조회에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// PUT /api/students/:id — Update student with change tracking
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'update');
    if (rbacError) return rbacError;
    const user = session!.user;

    const { id } = await params;

    // Verify the student exists and belongs to this university
    const existing = await prisma.student.findFirst({
      where: {
        id,
        universityId: user.universityId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    const body = await request.json();

    // Encrypt PII fields if present in the update payload
    const piiChanged =
      body.passportNumber !== undefined || body.arcNumber !== undefined;

    const updateData: Record<string, unknown> = { ...body };

    if (body.passportNumber !== undefined) {
      updateData.passportNumber = encrypt(body.passportNumber);
    }
    if (body.arcNumber !== undefined) {
      updateData.arcNumber = body.arcNumber ? encrypt(body.arcNumber) : null;
    }

    // Prevent overwriting tenant or ownership fields
    delete updateData.universityId;
    delete updateData.createdById;
    delete updateData.id;
    delete updateData.isDeleted;

    // Track changes on monitored fields and create StatusChange records
    const statusChangeCreates = TRACKED_FIELDS.filter((field) => {
      const newVal = body[field];
      return newVal !== undefined && newVal !== (existing[field] as string);
    }).map((field) => ({
      studentId: id,
      field,
      oldValue: existing[field] as string | null,
      newValue: body[field] as string,
      changedBy: user.id,
    }));

    // Perform update + status change inserts in a transaction
    const [updatedStudent] = await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data: updateData,
      }),
      ...(statusChangeCreates.length > 0
        ? statusChangeCreates.map((sc) =>
            prisma.statusChange.create({ data: sc })
          )
        : []),
    ]);

    // Audit log — distinguish PII updates from regular updates
    void createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      resource: piiChanged ? 'STUDENT_PII' : 'STUDENT',
      resourceId: id,
      details: statusChangeCreates.length > 0
        ? { changes: statusChangeCreates.map(({ studentId: _sid, changedBy: _cb, ...rest }) => rest) }
        : undefined,
    });

    // Omit PII from response
    const { passportNumber: _pp, arcNumber: _arc, ...responseData } = updatedStudent;

    return NextResponse.json({
      success: true,
      data: responseData,
    } satisfies ApiResponse<typeof responseData>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '학생 정보 수정에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// DELETE /api/students/:id — Soft delete (ADMIN only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'delete');
    if (rbacError) return rbacError;
    const user = session!.user;

    const { id } = await params;

    // Verify the student exists and belongs to this university
    const existing = await prisma.student.findFirst({
      where: {
        id,
        universityId: user.universityId,
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    // Soft delete — never hard delete
    await prisma.student.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Audit log
    void createAuditLog({
      userId: user.id,
      action: 'DELETE',
      resource: 'STUDENT',
      resourceId: id,
    });

    return NextResponse.json({
      success: true,
    } satisfies ApiResponse<never>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '학생 삭제에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
