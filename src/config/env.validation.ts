import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().min(1).default('api'),

    DATABASE_URL: z.url(),
    TEST_DATABASE_URL: z.url().optional(),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

    CORS_ORIGINS: z.string().default(''),

    // URL pública del frontend/app usada para armar los links de los correos
    // (verificación de email, reset de contraseña).
    APP_URL: z.url().default('http://localhost:3000'),

    EMAIL_VERIFICATION_EXPIRES_IN: z.string().default('24h'),
    PASSWORD_RESET_EXPIRES_IN: z.string().default('1h'),

    // SMTP: si SMTP_HOST no está definido, MailService escribe los correos al
    // log en vez de enviarlos (modo dev, ver src/mail/mail.service.ts).
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z.coerce.boolean().default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z
      .string()
      .default('Semana Santa de Timbío <no-reply@timbio.local>'),

    // Días que se conservan los refresh tokens revocados/expirados antes de
    // purgarlos (ver src/auth/token-cleanup.service.ts). Se mantienen un
    // tiempo por si hace falta investigar reuso/robo de tokens.
    TOKEN_CLEANUP_RETENTION_DAYS: z.coerce
      .number()
      .int()
      .positive()
      .default(30),
  })
  .superRefine((env, ctx) => {
    // In production, silently falling back to "allow any origin with
    // credentials" (see main.ts) would be a real CORS hole — force an
    // explicit allowlist instead of a permissive default.
    if (env.NODE_ENV === 'production' && env.CORS_ORIGINS.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message:
          'CORS_ORIGINS es obligatorio en producción (lista de orígenes separados por coma)',
      });
    }
  });

export type EnvVars = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${message}`);
  }
  return parsed.data;
}
