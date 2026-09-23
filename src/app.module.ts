import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './config/logger.module';
import type { AppConfig } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { MediaModule } from './media/media.module';
import { HeritageModule } from './heritage/heritage.module';
import { OperationsModule } from './operations/operations.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    MailModule,
    StorageModule,
    MediaModule,
    HeritageModule,
    OperationsModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { throttle } = configService.get<AppConfig>('app')!;
        return [{ ttl: throttle.ttlMs, limit: throttle.limit }];
      },
    }),
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
