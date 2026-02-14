import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types';
import type { University } from '@prisma/client';

// 대학 정보 조회 (현재 사용자의 소속 대학)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' } satisfies ApiResponse<never>,
        { status: 401 }
      );
    }

    const university = await prisma.university.findUnique({
      where: { id: session.user.universityId },
    });

    if (!university) {
      return NextResponse.json(
        { success: false, error: '대학 정보를 찾을 수 없습니다.' } satisfies ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: university,
    } satisfies ApiResponse<University>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '대학 정보를 가져올 수 없습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
