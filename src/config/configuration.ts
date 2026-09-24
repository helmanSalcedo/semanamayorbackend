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
  storage: {
    maxFileSizeMb: number;
    firebase?: {
      projectId: string;
      clientEmail: string;
      privateKey: string;
      storageBucket: string;
    };
  };
  receipts: {
    issuerName: string;
    issuerTaxId?: string;
    issuerAddress?: string;
  };
  paymentWebhooks: {
    wompiEventsSecret?: string;
    payu?: { apiKey: string; merchantId: string };
    epayco?: { pKey: string; custIdCliente: string };
  };
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
      storage: {
        maxFileSizeMb: Number(env.MEDIA_MAX_FILE_SIZE_MB),
        firebase:
          env.FIREBASE_PROJECT_ID &&
          env.FIREBASE_CLIENT_EMAIL &&
          env.FIREBASE_PRIVATE_KEY &&
          env.FIREBASE_STORAGE_BUCKET
            ? {
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                // .env stores the PEM with literal "\n" escapes (real
                // newlines break most .env parsers/quoting) — unescape here.
                privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                storageBucket: env.FIREBASE_STORAGE_BUCKET,
              }
            : undefined,
      },
      receipts: {
        issuerName: env.RECEIPT_ISSUER_NAME,
        issuerTaxId: env.RECEIPT_ISSUER_TAX_ID || undefined,
        issuerAddress: env.RECEIPT_ISSUER_ADDRESS || undefined,
      },
      paymentWebhooks: {
        wompiEventsSecret: env.WOMPI_EVENTS_SECRET,
        payu:
          env.PAYU_API_KEY && env.PAYU_MERCHANT_ID
            ? { apiKey: env.PAYU_API_KEY, merchantId: env.PAYU_MERCHANT_ID }
            : undefined,
        epayco:
          env.EPAYCO_P_KEY && env.EPAYCO_P_CUST_ID_CLIENTE
            ? {
                pKey: env.EPAYCO_P_KEY,
                custIdCliente: env.EPAYCO_P_CUST_ID_CLIENTE,
              }
            : undefined,
      },
    },
  };
};
