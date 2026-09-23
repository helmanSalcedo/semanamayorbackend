import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports database up', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('rejects unauthenticated access to a protected route', () => {
    return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('supports register -> login -> me -> refresh', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'Segura123';

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, fullName: 'E2E Test User' })
      .expect(201);

    expect(registerRes.body.user.roles).toContain('VIEWER');
    expect(registerRes.body.accessToken).toBeDefined();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const { accessToken, refreshToken } = loginRes.body;

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(email);
      });

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.refreshToken).not.toBe(refreshToken);

    // Old refresh token was rotated out and must be rejected now.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('rejects login with wrong password', async () => {
    const email = `e2e-wrong-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'Segura123', fullName: 'E2E Test User' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass1' })
      .expect(401);
  });

  it('rejects an invalid email verification token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: 'not-a-real-token' })
      .expect(401);
  });

  it('rejects an invalid password reset token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: 'not-a-real-token', newPassword: 'NuevaClave1' })
      .expect(401);
  });

  it('gives a generic response for forgot-password regardless of whether the email exists', async () => {
    const email = `e2e-forgot-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'Segura123', fullName: 'E2E Test User' })
      .expect(201);

    const known = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email })
      .expect(200);

    const unknown = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'no-existe@example.com' })
      .expect(200);

    expect(known.body.message).toBe(unknown.body.message);
  });

  it('gives a generic response for resend-verification regardless of whether the email exists', async () => {
    const email = `e2e-resend-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'Segura123', fullName: 'E2E Test User' })
      .expect(201);

    const known = await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .send({ email })
      .expect(200);

    const unknown = await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'no-existe@example.com' })
      .expect(200);

    expect(known.body.message).toBe(unknown.body.message);
  });
});
