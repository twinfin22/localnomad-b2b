import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { encrypt } from '@/lib/crypto';
import { calculateTrafficLightBatch } from '@/lib/traffic-light';
import type { ApiResponse } from '@/types';
import {
  Prisma,
  VisaStatus,
  VisaType,
  EnrollmentStatus,
} from '@prisma/client';

// Allowed sort fields to prevent arbitrary column access
const ALLOWED_SORT_FIELDS: Set<string> = new Set([
  'createdAt',
  'updatedAt',
  'nameEn',
  'nameKr',
  'visaExpiry',
  'visaStatus',
  'enrollmentStatus',
  'department',
  'nationality',
]);


// GET /api/students — Student list with pagination, filtering, and traffic light
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'read');
    if (rbacError) return rbacError;
    const user = session!.user;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const search = searchParams.get('search')?.trim() || '';
    const visaStatus = searchParams.get('visaStatus') || '';
    const enrollmentStatus = searchParams.get('enrollmentStatus') || '';
    const department = searchParams.get('department')?.trim() || '';
    const visaType = searchParams.get('visaType') || '';
    const trafficLight = searchParams.get('trafficLight') || '';

    const rawSortBy = searchParams.get('sortBy') || 'createdAt';
    const sortBy = ALLOWED_SORT_FIELDS.has(rawSortBy) ? rawSortBy : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build dynamic where clause — always scoped to the user's university
    const where: Prisma.StudentWhereInput = {
      universityId: user.universityId,
      isDeleted: false,
    };

    const andConditions: Prisma.StudentWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { nameKr: { contains: search } },
          { nameEn: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    if (visaStatus) {
      andConditions.push({ visaStatus: visaStatus as VisaStatus });
    }
    if (enrollmentStatus) {
      andConditions.push({ enrollmentStatus: enrollmentStatus as EnrollmentStatus });
    }
    if (department) {
      andConditions.push({ department: { contains: department } });
    }
    if (visaType) {
      andConditions.push({ visaType: visaType as VisaType });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // When trafficLight filter is present, we need to fetch all matching students,
    // compute TL in-memory, filter by TL status, then paginate in-memory
    if (trafficLight) {
      const allStudents = await prisma.student.findMany({
        where,
        omit: { passportNumber: true, arcNumber: true },
        include: {
          fimsReports: {
            where: { status: { in: ['PENDING', 'READY'] } },
            select: { status: true, deadline: true },
          },
        },
      });

      // Prepare input and compute TL for all students
      const tlInputs = allStudents.map((s) => ({
        id: s.id,
        visaExpiry: s.visaExpiry,
        visaStatus: s.visaStatus,
        enrollmentStatus: s.enrollmentStatus,
        attendanceRate: s.attendanceRate !== null ? Number(s.attendanceRate) : null,
        insuranceStatus: s.insuranceStatus,
        addressReported: s.addressReported,
        partTimePermit: s.partTimePermit,
        partTimePermitExpiry: s.partTimePermitExpiry,
        fimsReports: s.fimsReports,
      }));

      const tlResults = calculateTrafficLightBatch(tlInputs);

      // Filter by requested TL status
      const filtered = allStudents.filter((s) => {
        const result = tlResults.get(s.id);
        return result?.status === trafficLight;
      });

      // Sort: use provided sortBy/sortOrder if explicitly set, otherwise default to visaExpiry ASC
      const hasExplicitSort = searchParams.has('sortBy');
      if (hasExplicitSort) {
        filtered.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[sortBy];
          const bVal = (b as Record<string, unknown>)[sortBy];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return sortOrder === 'asc' ? -1 : 1;
          if (bVal == null) return sortOrder === 'asc' ? 1 : -1;
          if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      } else {
        // Default: visaExpiry ASC (earliest expiry first)
        filtered.sort((a, b) =>
          new Date(a.visaExpiry).getTime() - new Date(b.visaExpiry).getTime()
        );
      }

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limit);

      // Attach TL fields to each student
      const data = paginated.map((s) => {
        const tl = tlResults.get(s.id)!;
        return {
          ...s,
          attendanceRate: s.attendanceRate !== null ? Number(s.attendanceRate) : null,
          trafficLight: tl.status,
          trafficLightReasons: tl.reasons,
        };
      });

      return NextResponse.json({
        success: true,
        data,
        meta: { total, page, limit },
      });
    }

    // No trafficLight filter — standard DB-paginated path with TL computed for the page
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        omit: { passportNumber: true, arcNumber: true },
        include: {
          fimsReports: {
            where: { status: { in: ['PENDING', 'READY'] } },
            select: { status: true, deadline: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.student.count({ where }),
    ]);

    // Compute TL for the returned page
    const tlInputs = students.map((s) => ({
      id: s.id,
      visaExpiry: s.visaExpiry,
      visaStatus: s.visaStatus,
      enrollmentStatus: s.enrollmentStatus,
      attendanceRate: s.attendanceRate !== null ? Number(s.attendanceRate) : null,
      insuranceStatus: s.insuranceStatus,
      addressReported: s.addressReported,
      partTimePermit: s.partTimePermit,
      partTimePermitExpiry: s.partTimePermitExpiry,
      fimsReports: s.fimsReports,
    }));

    const tlResults = calculateTrafficLightBatch(tlInputs);

    const data = students.map((s) => {
      const tl = tlResults.get(s.id)!;
      return {
        ...s,
        attendanceRate: s.attendanceRate !== null ? Number(s.attendanceRate) : null,
        trafficLight: tl.status,
        trafficLightReasons: tl.reasons,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit },
    } satisfies ApiResponse<typeof data>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '학생 목록 조회에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// Required fields for student creation
const REQUIRED_FIELDS = [
  'nameEn',
  'nationality',
  'visaType',
  'visaExpiry',
  'enrollmentStatus',
  'programType',
  'department',
] as const;

// POST /api/students — Create a new student
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const rbacError = withRbac(session, 'student', 'create');
    if (rbacError) return rbacError;
    const user = session!.user;

    const body = await request.json();

    // Validate required fields
    const missingFields = REQUIRED_FIELDS.filter(
      (field) => body[field] === undefined || body[field] === null || body[field] === ''
    );
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `필수 항목이 누락되었습니다: ${missingFields.join(', ')}`,
        } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    // Encrypt PII fields before storage
    const encryptedPassport = body.passportNumber ? encrypt(body.passportNumber) : undefined;
    const encryptedArc = body.arcNumber ? encrypt(body.arcNumber) : undefined;

    // Strip raw PII from body to prevent accidental pass-through
    const { passportNumber: _pp, arcNumber: _arc, ...safeBody } = body;

    const student = await prisma.student.create({
      data: {
        ...safeBody,
        ...(encryptedPassport !== undefined && { passportNumber: encryptedPassport }),
        ...(encryptedArc !== undefined && { arcNumber: encryptedArc }),
        universityId: user.universityId,
        createdById: user.id,
      },
    });

    // Fire-and-forget audit log
    void createAuditLog({
      userId: user.id,
      action: 'CREATE',
      resource: 'STUDENT',
      resourceId: student.id,
    });

    // Omit PII from response
    const { passportNumber: _rpp, arcNumber: _rarc, ...responseData } = student;

    return NextResponse.json(
      { success: true, data: responseData } satisfies ApiResponse<typeof responseData>,
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '학생 등록에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
