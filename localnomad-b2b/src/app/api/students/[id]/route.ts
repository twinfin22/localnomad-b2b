import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';
import type { Student } from '@prisma/client';

// Next.js 16: params는 비동기 Promise
type RouteParams = { params: Promise<{ id: string }> };

// 학생 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;

    const student = await prisma.student.findFirst({
      where: {
        id,
        universityId: session.user.universityId,
        isDeleted: false,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: '학생을 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    } satisfies ApiResponse<Student>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// 학생 정보 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const student = await prisma.student.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: student,
    } satisfies ApiResponse<Student>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '학생 정보 수정에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// 학생 삭제 (소프트 삭제)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.student.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({
      success: true,
    } satisfies ApiResponse<never>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '학생 삭제에 실패했습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
