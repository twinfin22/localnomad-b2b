import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac, checkPermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { encrypt, decrypt } from '@/lib/crypto';
import { calculateTrafficLight } from '@/lib/traffic-light';
import {
  STATUS_CHANGE_FIELD_LABELS,
  ENROLLMENT_STATUS_LABELS,
  VISA_STATUS_LABELS,
  VISA_TYPE_LABELS,
  FIMS_REPORT_TYPE_LABELS,
  FIMS_CHANGE_TYPE_LABELS,
  FIMS_REPORT_STATUS_LABELS,
  ALERT_TYPE_LABELS,
} from '@/lib/constants';
import type { ApiResponse, TimelineItem } from '@/types';

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

    // Parallel queries for related data
    const [statusChanges, fimsReports, alertLogs, fimsForTl, createdByUser] =
      await Promise.all([
        prisma.statusChange.findMany({
          where: { studentId: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.fimsReport.findMany({
          where: { studentId: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.alertLog.findMany({
          where: { studentId: id },
          orderBy: { sentAt: 'desc' },
          take: 20,
        }),
        prisma.fimsReport.findMany({
          where: {
            studentId: id,
            status: { in: ['PENDING', 'READY'] },
          },
          select: { status: true, deadline: true },
        }),
        prisma.user.findUnique({
          where: { id: student.createdById },
          select: { name: true },
        }),
      ]);

    // Compute traffic light
    const tlResult = calculateTrafficLight({
      visaExpiry: student.visaExpiry,
      visaStatus: student.visaStatus,
      enrollmentStatus: student.enrollmentStatus,
      attendanceRate: student.attendanceRate ? Number(student.attendanceRate) : null,
      insuranceStatus: student.insuranceStatus,
      addressReported: student.addressReported,
      partTimePermit: student.partTimePermit,
      partTimePermitExpiry: student.partTimePermitExpiry,
      fimsReports: fimsForTl.map((r) => ({
        status: r.status,
        deadline: r.deadline,
      })),
    });

    // Build timeline from 3 sources
    const scTimeline: TimelineItem[] = statusChanges.map((sc) => {
      const fieldLabel = STATUS_CHANGE_FIELD_LABELS[sc.field] || sc.field;
      const oldLabel = getFieldValueLabel(sc.field, sc.oldValue);
      const newLabel = getFieldValueLabel(sc.field, sc.newValue);
      return {
        id: sc.id,
        type: 'STATUS_CHANGE',
        date: sc.createdAt.toISOString(),
        title: `${fieldLabel} 변경`,
        description: `${oldLabel} → ${newLabel}`,
        metadata: { field: sc.field, oldValue: sc.oldValue ?? '', newValue: sc.newValue ?? '' },
      };
    });

    const fimsTimeline: TimelineItem[] = fimsReports.map((fr) => {
      const reportType = FIMS_REPORT_TYPE_LABELS[fr.reportType] || fr.reportType;
      const changeType = fr.changeType
        ? FIMS_CHANGE_TYPE_LABELS[fr.changeType] || fr.changeType
        : null;
      const statusLabel = FIMS_REPORT_STATUS_LABELS[fr.status] || fr.status;
      return {
        id: fr.id,
        type: 'FIMS_REPORT',
        date: fr.createdAt.toISOString(),
        title: `FIMS ${reportType}${changeType ? ` (${changeType})` : ''}`,
        description: `상태: ${statusLabel}`,
        metadata: { reportType: fr.reportType, status: fr.status },
      };
    });

    const alertTimeline: TimelineItem[] = alertLogs.map((al) => {
      const typeLabel = ALERT_TYPE_LABELS[al.type] || al.type;
      return {
        id: al.id,
        type: 'ALERT',
        date: al.sentAt.toISOString(),
        title: typeLabel,
        description: al.message,
      };
    });

    // Merge, sort by date DESC, take 20
    const timeline = [...scTimeline, ...fimsTimeline, ...alertTimeline]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    // Determine PII access level based on role
    const canReadPii = checkPermission(user.role, 'student_pii', 'read');

    let passportDisplay: string | null;
    let arcDisplay: string | null;

    if (canReadPii) {
      // ADMIN or MANAGER: decrypt and expose PII
      passportDisplay = student.passportNumber ? decrypt(student.passportNumber) : null;
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
      if (student.passportNumber) {
        try {
          passportDisplay = maskPii(decrypt(student.passportNumber));
        } catch {
          passportDisplay = '****';
        }
      } else {
        passportDisplay = null;
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
      trafficLight: tlResult.status,
      trafficLightReasons: tlResult.reasons,
      createdByName: createdByUser?.name ?? null,
      canReadPii,
      timeline,
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

// Helper to resolve label for a field value change
function getFieldValueLabel(field: string, value: string | null | undefined): string {
  if (!value) return '-';
  switch (field) {
    case 'enrollmentStatus':
      return ENROLLMENT_STATUS_LABELS[value] || value;
    case 'visaStatus':
      return VISA_STATUS_LABELS[value] || value;
    case 'visaType':
      return VISA_TYPE_LABELS[value] || value;
    default:
      return value;
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
      updateData.passportNumber = body.passportNumber ? encrypt(body.passportNumber) : null;
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
