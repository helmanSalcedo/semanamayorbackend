import { Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const logger = new Logger('AuditLog');

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * App-level counterpart to the DB triggers that audit finance.* tables
 * automatically (see docs/database/AUDIT.md). Events that aren't row
 * mutations on those tables — login/logout, publish/unpublish, permission
 * changes — have no trigger to observe them, so the backend must insert
 * them explicitly. Never throws: an audit-trail failure must not break the
 * operation it's describing, same rule as sendMailSafely().
 */
export async function recordAuditLog(
  prisma: PrismaService,
  entry: AuditLogEntry,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues as Prisma.InputJsonValue | undefined,
        newValues: entry.newValues as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    logger.error(
      `No se pudo registrar el evento de auditoría (${entry.action} ${entry.entityType})`,
      (error as Error).stack,
    );
  }
}
