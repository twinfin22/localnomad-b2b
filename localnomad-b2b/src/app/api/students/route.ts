import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';
import type { Student } from '@prisma/client';

// 학생 목록 조회 (페이지네이션, 필터)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // 병렬 쿼리로 학생 목록과 전체 수 조회
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: {
          universityId: session.user.universityId,
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({
        where: {
          universityId: session.user.universityId,
          isDeleted: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      meta: { total, page, limit },
    } satisfies ApiResponse<Student[]>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// 학생 등록
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const body = await request.json();

    const student = await prisma.student.create({
      data: {
        ...body,
        universityId: session.user.universityId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(
      { success: true, data: student } satisfies ApiResponse<Student>,
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '학생 등록에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
