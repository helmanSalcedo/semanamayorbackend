import { validateEnv } from './env.validation';

const BASE_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('accepts a minimal development config with empty CORS_ORIGINS', () => {
    expect(() =>
      validateEnv({ ...BASE_ENV, NODE_ENV: 'development' }),
    ).not.toThrow();
  });

  it('rejects production without CORS_ORIGINS', () => {
    expect(() => validateEnv({ ...BASE_ENV, NODE_ENV: 'production' })).toThrow(
      /CORS_ORIGINS/,
    );
  });

  it('accepts production with CORS_ORIGINS set', () => {
    expect(() =>
      validateEnv({
        ...BASE_ENV,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://timbio.org',
      }),
    ).not.toThrow();
  });
});
