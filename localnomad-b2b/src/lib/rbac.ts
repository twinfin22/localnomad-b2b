import { UserRole } from '@prisma/client';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';

// Permission matrix: maps "resource:action" keys to the set of roles allowed
const PERMISSIONS: Record<string, Set<UserRole>> = {
  'student:read': new Set([UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER]),
  'student:create': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'student:update': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'student:delete': new Set([UserRole.ADMIN]),
  'student_pii:read': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'user:read': new Set([UserRole.ADMIN]),
  'user:create': new Set([UserRole.ADMIN]),
  'user:update': new Set([UserRole.ADMIN]),
  'user:delete': new Set([UserRole.ADMIN]),
  'settings:update': new Set([UserRole.ADMIN]),
  'alert:read': new Set([UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER]),
  'alert:create': new Set([UserRole.ADMIN]),
  'alert:update': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'fims:export': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'import:create': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'audit_log:read': new Set([UserRole.ADMIN]),
  'chat:read': new Set([UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER]),
  'chat:create': new Set([UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER]),
  'chat:reply': new Set([UserRole.ADMIN, UserRole.MANAGER]),
  'chat:escalate': new Set([UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER]),
};

/**
 * Check whether a given role has permission for a resource:action pair.
 * Returns false for unknown permission keys.
 */
export const checkPermission = (
  role: UserRole,
  resource: string,
  action: string
): boolean => {
  const key = `${resource}:${action}`;
  const allowedRoles = PERMISSIONS[key];

  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.has(role);
};

/**
 * Assert that a role has permission. Throws an Error with a Korean
 * user-facing message if the role is not authorized.
 */
export const requirePermission = (
  role: UserRole,
  resource: string,
  action: string
): void => {
  if (!checkPermission(role, resource, action)) {
    throw new Error('권한이 없습니다.');
  }
};

/**
 * RBAC guard for API route handlers.
 * Returns a NextResponse (401 or 403) when access is denied,
 * or null when the request is authorized and may proceed.
 */
export const withRbac = (
  session: Session | null,
  resource: string,
  action: string
): NextResponse | null => {
  if (!session) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  if (!checkPermission(session.user.role, resource, action)) {
    return NextResponse.json(
      { success: false, error: '권한이 없습니다.' },
      { status: 403 }
    );
  }

  // Authorized — caller should proceed with the request
  return null;
};
