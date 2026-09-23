import { AuditAction } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogService', () => {
  let prisma: { auditLog: { findMany: jest.Mock; count: jest.Mock } };
  let service: AuditLogService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    service = new AuditLogService(prisma as unknown as PrismaService);
  });

  it('filters by entityType/entityId/userId/action when given', async () => {
    await service.findAll({
      page: 1,
      limit: 20,
      skip: 0,
      entityType: 'finance.donation',
      entityId: 'donation-1',
      userId: 'user-1',
      action: AuditAction.UPDATE,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          entityType: 'finance.donation',
          entityId: 'donation-1',
          userId: 'user-1',
          action: AuditAction.UPDATE,
        },
      }),
    );
  });
});
