import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const { port, apiPrefix, corsOrigins, nodeEnv } =
    configService.get<AppConfig>('app')!;

  // helmet/compression ship dual CJS+ESM types that typescript-eslint's
  // type-aware resolution can't follow under this tsconfig — safe at runtime.
  /* eslint-disable @typescript-eslint/no-unsafe-call */
  app.use(helmet());
  app.use(compression());
  /* eslint-enable @typescript-eslint/no-unsafe-call */

  // `credentials: true` only makes sense paired with an explicit origin
  // allowlist — combined with a reflected/wildcard origin it lets any site
  // make credentialed requests. This API is Bearer-token based (no cookies),
  // so the permissive dev fallback doesn't need credentials at all.
  const hasExplicitOrigins = corsOrigins.length > 0;
  app.enableCors({
    origin: hasExplicitOrigins ? corsOrigins : true,
    credentials: hasExplicitOrigins,
  });

  app.setGlobalPrefix(apiPrefix, { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Semana Santa de Timbío — API')
      .setDescription(
        'API de la plataforma cultural/religiosa de Semana Santa de Timbío',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(port);
  logger.log(
    `Servidor escuchando en el puerto ${port} (prefijo /${apiPrefix})`,
  );
}

void bootstrap();
