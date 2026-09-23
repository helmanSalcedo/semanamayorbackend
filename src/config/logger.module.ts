import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { AppConfig } from './configuration';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { logLevel, nodeEnv } = configService.get<AppConfig>('app')!;
        return {
          pinoHttp: {
            level: logLevel,
            genReqId: (req: {
              headers: Record<string, string | string[] | undefined>;
            }) => req.headers['x-request-id'] ?? randomUUID(),
            transport:
              nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
