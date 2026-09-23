import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

/**
 * auth.refresh_token grows forever otherwise: every login/refresh inserts a
 * row and rotation only ever sets revokedAt, nothing ever deletes them.
 * Revoked/expired tokens are kept for a retention window (in case a token
 * reuse/theft needs investigating) and purged after that.
 */
@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);
  private readonly retentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.retentionDays =
      configService.get<AppConfig>('app')!.tokenCleanupRetentionDays;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeStaleRefreshTokens(): Promise<void> {
    const cutoff = new Date(
      Date.now() - this.retentionDays * 24 * 60 * 60 * 1000,
    );

    const { count } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { revokedAt: { lt: cutoff } },
          { revokedAt: null, expiresAt: { lt: cutoff } },
        ],
      },
    });

    if (count > 0) {
      this.logger.log(
        `Purgados ${count} refresh tokens revocados/expirados hace más de ${this.retentionDays}d`,
      );
    }
  }
}
