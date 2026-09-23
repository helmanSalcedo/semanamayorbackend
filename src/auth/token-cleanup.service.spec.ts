import { ConfigService } from '@nestjs/config';
import { TokenCleanupService } from './token-cleanup.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TokenCleanupService', () => {
  it('deletes refresh tokens revoked or expired past the retention window', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    const prisma = { refreshToken: { deleteMany } } as unknown as PrismaService;
    const configService = {
      get: () => ({ tokenCleanupRetentionDays: 30 }),
    } as unknown as ConfigService;

    const service = new TokenCleanupService(prisma, configService);
    await service.purgeStaleRefreshTokens();

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { revokedAt: { lt: expect.any(Date) } },
          { revokedAt: null, expiresAt: { lt: expect.any(Date) } },
        ],
      },
    });
  });
});
