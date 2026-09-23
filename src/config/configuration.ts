import type { EnvVars } from './env.validation';

export interface AppConfig {
  nodeEnv: EnvVars['NODE_ENV'];
  port: number;
  apiPrefix: string;
  logLevel: EnvVars['LOG_LEVEL'];
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  throttle: {
    ttlMs: number;
    limit: number;
  };
  appUrl: string;
  mail: {
    emailVerificationExpiresIn: string;
    passwordResetExpiresIn: string;
    from: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      user?: string;
      password?: string;
    };
  };
  tokenCleanupRetentionDays: number;
}

export default (): { app: AppConfig } => {
  const env = process.env as unknown as EnvVars;

  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: Number(env.PORT),
      apiPrefix: env.API_PREFIX,
      logLevel: env.LOG_LEVEL,
      corsOrigins: env.CORS_ORIGINS
        ? env.CORS_ORIGINS.split(',').map((o) => o.trim())
        : [],
      jwt: {
        accessSecret: env.JWT_ACCESS_SECRET,
        accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
      throttle: {
        ttlMs: Number(env.THROTTLE_TTL_MS),
        limit: Number(env.THROTTLE_LIMIT),
      },
      appUrl: env.APP_URL,
      mail: {
        emailVerificationExpiresIn: env.EMAIL_VERIFICATION_EXPIRES_IN,
        passwordResetExpiresIn: env.PASSWORD_RESET_EXPIRES_IN,
        from: env.MAIL_FROM,
        smtp: env.SMTP_HOST
          ? {
              host: env.SMTP_HOST,
              port: Number(env.SMTP_PORT),
              secure: Boolean(env.SMTP_SECURE),
              user: env.SMTP_USER,
              password: env.SMTP_PASSWORD,
            }
          : undefined,
      },
      tokenCleanupRetentionDays: Number(env.TOKEN_CLEANUP_RETENTION_DAYS),
    },
  };
};
