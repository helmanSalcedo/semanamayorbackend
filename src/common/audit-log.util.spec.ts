import { AuditAction } from '@prisma/client';
import { recordAuditLog } from './audit-log.util';
import { PrismaService } from '../prisma/prisma.service';

describe('recordAuditLog', () => {
  it('inserts the entry with the given fields', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prisma = { auditLog: { create } } as unknown as PrismaService;

    await recordAuditLog(prisma, {
      userId: 'user-1',
      action: AuditAction.LOGIN,
      entityType: 'auth.user',
      entityId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'curl/8.0',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: AuditAction.LOGIN,
        entityType: 'auth.user',
        entityId: 'user-1',
        oldValues: undefined,
        newValues: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'curl/8.0',
      },
    });
  });

  it('never throws when the insert fails', async () => {
    const create = jest.fn().mockRejectedValue(new Error('DB down'));
    const prisma = { auditLog: { create } } as unknown as PrismaService;

    await expect(
      recordAuditLog(prisma, {
        action: AuditAction.LOGOUT,
        entityType: 'auth.user',
      }),
    ).resolves.toBeUndefined();
  });
});
