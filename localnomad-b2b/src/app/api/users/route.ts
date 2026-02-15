import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRbac } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import type { ApiResponse } from '@/types';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'hashedPassword'>;

// List users in the same university (ADMIN only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const rbacResponse = withRbac(session, 'user', 'read');
    if (rbacResponse) return rbacResponse;

    const users = await prisma.user.findMany({
      where: { universityId: session!.user.universityId },
      omit: { hashedPassword: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: users,
    } satisfies ApiResponse<UserWithoutPassword[]>);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '사용자 목록을 가져올 수 없습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}

// Create a new user in the same university (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const rbacResponse = withRbac(session, 'user', 'create');
    if (rbacResponse) return rbacResponse;

    const body = await request.json();
    const { email, name, role, password } = body as {
      email?: string;
      name?: string;
      role?: UserRole;
      password?: string;
    };

    // Validate required fields
    if (!email || !name || !role || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '이메일, 이름, 역할, 비밀번호는 필수 항목입니다.',
        } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: '이미 사용 중인 이메일입니다.',
        } satisfies ApiResponse<never>,
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        hashedPassword,
        universityId: session!.user.universityId,
      },
    });

    // Record audit log
    await createAuditLog({
      userId: session!.user.id,
      action: 'CREATE',
      resource: 'USER',
      resourceId: user.id,
      details: { email, name, role },
    });

    // Exclude hashedPassword from the response
    const { hashedPassword: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      } satisfies ApiResponse<UserWithoutPassword>,
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '사용자를 생성할 수 없습니다.';
    return NextResponse.json(
      { success: false, error: message } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
