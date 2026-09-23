import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

// argon2's namespace import isn't spy-able directly (non-configurable
// properties under esModuleInterop) — wrap `verify` in a jest.fn around the
// real implementation so the timing-attack-guard test can assert on it
// while every other test keeps real argon2 behavior.
jest.mock('argon2', () => {
  const actual = jest.requireActual<typeof argon2>('argon2');
  return { ...actual, verify: jest.fn(actual.verify) };
});
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

const APP_CONFIG = {
  jwt: {
    accessSecret: 'a'.repeat(32),
    accessExpiresIn: '15m',
    refreshSecret: 'b'.repeat(32),
    refreshExpiresIn: '7d',
  },
  appUrl: 'http://localhost:3000',
  mail: {
    emailVerificationExpiresIn: '24h',
    passwordResetExpiresIn: '1h',
    from: 'no-reply@timbio.local',
  },
};

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'persona@example.com',
    fullName: 'Persona Ejemplo',
    passwordHash: 'hashed',
    isActive: true,
    deletedAt: null,
    emailVerifiedAt: null,
    roles: [
      {
        role: {
          code: 'VIEWER',
          permissions: [],
        },
      },
    ],
    ...overrides,
  };
}

describe('AuthService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    role: { findUniqueOrThrow: jest.Mock };
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    emailVerification: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let mailService: { send: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      role: { findUniqueOrThrow: jest.fn() },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      emailVerification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    mailService = { send: jest.fn().mockResolvedValue(undefined) };
    const configService = { get: () => APP_CONFIG } as unknown as ConfigService;

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      mailService as unknown as MailService,
      configService,
    );
  });

  describe('register', () => {
    it('throws when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());

      await expect(
        service.register({
          email: 'persona@example.com',
          password: 'Segura123',
          fullName: 'X',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the user with the default VIEWER role, issues tokens and sends a verification email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 'role-viewer',
        code: 'VIEWER',
      });
      prisma.user.create.mockResolvedValue(buildUser());
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.emailVerification.create.mockResolvedValue({});

      const result = await service.register({
        email: 'persona@example.com',
        password: 'Segura123',
        fullName: 'Persona Ejemplo',
      });

      expect(prisma.role.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { code: 'VIEWER' },
      });
      expect(prisma.emailVerification.create).toHaveBeenCalled();
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'persona@example.com' }),
      );
      expect(result.user.roles).toEqual(['VIEWER']);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.expiresIn).toBe(15 * 60);
    });

    it('does not fail registration when sending the verification email throws', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUniqueOrThrow.mockResolvedValue({
        id: 'role-viewer',
        code: 'VIEWER',
      });
      prisma.user.create.mockResolvedValue(buildUser());
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.emailVerification.create.mockResolvedValue({});
      mailService.send.mockRejectedValue(new Error('SMTP down'));

      await expect(
        service.register({
          email: 'persona@example.com',
          password: 'Segura123',
          fullName: 'Persona Ejemplo',
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('login', () => {
    it('rejects unknown emails without revealing whether the account exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nadie@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('still runs a password hash comparison for an unknown email (timing-attack guard)', async () => {
      const verifyMock = argon2.verify as jest.Mock;
      verifyMock.mockClear();
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nadie@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);

      // Must hash-compare against *something* even when there's no user,
      // otherwise the missing-account path returns measurably faster.
      expect(verifyMock).toHaveBeenCalledTimes(1);
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await argon2.hash('Segura123');
      prisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        service.login({
          email: 'persona@example.com',
          password: 'Incorrecta1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('logs in with the correct password and issues tokens', async () => {
      const passwordHash = await argon2.hash('Segura123');
      prisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'persona@example.com',
        password: 'Segura123',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('refresh', () => {
    it('rejects an unknown or expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('bogus-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an already-revoked refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1_000_000),
        user: buildUser(),
      });
      await expect(service.refresh('used-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rotates a valid refresh token and issues a new pair', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 1_000_000),
        user: buildUser(),
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('logout', () => {
    it('revokes the matching non-revoked refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      await service.logout('some-token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ revokedAt: null }),
          data: { revokedAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('resendVerification', () => {
    it('does nothing for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await service.resendVerification('nadie@example.com');
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('does nothing for an already-verified email', async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({ emailVerifiedAt: new Date() }),
      );
      await service.resendVerification('persona@example.com');
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('sends a new verification email for an unverified account', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.emailVerification.create.mockResolvedValue({});
      await service.resendVerification('persona@example.com');
      expect(mailService.send).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('rejects an unknown or expired token', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue(null);
      await expect(service.verifyEmail('bogus')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects an already-used token', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue({
        id: 'ev-1',
        userId: 'user-1',
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 1_000_000),
      });
      await expect(service.verifyEmail('used')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('marks the token and the user as verified', async () => {
      prisma.emailVerification.findUnique.mockResolvedValue({
        id: 'ev-1',
        userId: 'user-1',
        verifiedAt: null,
        expiresAt: new Date(Date.now() + 1_000_000),
      });
      prisma.emailVerification.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.verifyEmail('valid');

      expect(prisma.emailVerification.update).toHaveBeenCalledWith({
        where: { id: 'ev-1' },
        data: { verifiedAt: expect.any(Date) },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: expect.any(Date) },
      });
    });
  });

  describe('forgotPassword', () => {
    it('does nothing for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await service.forgotPassword('nadie@example.com');
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('creates a reset token and emails it for a known active account', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordResetToken.create.mockResolvedValue({});

      await service.forgotPassword('persona@example.com');

      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'persona@example.com' }),
      );
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown, used or expired token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(
        service.resetPassword('bogus', 'NuevaClave1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates the password and revokes existing refresh tokens', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'pr-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 1_000_000),
      });
      prisma.passwordResetToken.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.resetPassword('valid', 'NuevaClave1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
