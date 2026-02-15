import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Supported audit log action types
export interface CreateAuditLogParams {
  userId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN';
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

// Create an audit log entry.
// Callers can await this to ensure the log is written,
// or call without awaiting for fire-and-forget behavior.
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details ? (params.details as Prisma.InputJsonValue) : undefined,
        ipAddress: params.ipAddress ?? undefined,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to create audit log:', error);
  }
}
