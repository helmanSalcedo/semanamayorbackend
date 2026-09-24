import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { StringValue } from 'ms';
import type { AppConfig } from '../config/configuration';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type {
  AuthenticatedUser,
  JwtPayload,
} from './types/jwt-payload.interface';
import { parseDurationMs } from './util/duration.util';
import { generateOpaqueToken, hashOpaqueToken } from './util/token.util';

const DEFAULT_SELF_SIGNUP_ROLE = 'VIEWER';

// Fixed argon2 hash of an arbitrary password, verified against unknown
// emails in login() so the response takes the same time whether or not the
// account exists. It is not a secret — argon2.verify never succeeds against
// a real user's password with this hash.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$YK1IvLr5l8p3M/1+5f7VJQ$3qJ5qg63ql/4gKLna56TwLNRUesaNAMim6C9EX6bios';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

interface UserWithRoles {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  isActive: boolean;
  deletedAt: Date | null;
  roles: {
    role: { code: string; permissions: { permission: { code: string } }[] };
  }[];
}

const USER_WITH_ROLES_INCLUDE = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: AppConfig['jwt'];
  private readonly appUrl: string;
  private readonly mailConfig: AppConfig['mail'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    configService: ConfigService,
  ) {
    const appConfig = configService.get<AppConfig>('app')!;
    this.jwtConfig = appConfig.jwt;
    this.appUrl = appConfig.appUrl;
    this.mailConfig = appConfig.mail;
  }

  async register(
    dto: RegisterDto,
    sessionMeta?: SessionMeta,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const passwordHash = await argon2.hash(dto.password);
    const defaultRole = await this.prisma.role.findUniqueOrThrow({
      where: { code: DEFAULT_SELF_SIGNUP_ROLE },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        roles: { create: { roleId: defaultRole.id } },
      },
      include: USER_WITH_ROLES_INCLUDE,
    });

    await this.sendVerificationEmail(user.id, user.email);

    const tokens = await this.issueTokenPair(user, sessionMeta);
    return { user: this.toAuthenticatedUser(user), ...tokens };
  }

  async login(
    dto: LoginDto,
    sessionMeta?: SessionMeta,
  ): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: USER_WITH_ROLES_INCLUDE,
    });

    // Always run argon2.verify, even for an unknown email, against a fixed
    // dummy hash: skipping it when the user doesn't exist makes the response
    // measurably faster and lets an attacker enumerate valid accounts by
    // timing alone.
    const passwordMatches = await argon2.verify(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      dto.password,
    );

    if (!user || user.deletedAt || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user, sessionMeta);
    return { user: this.toAuthenticatedUser(user), ...tokens };
  }

  async refresh(
    refreshToken: string,
    sessionMeta?: SessionMeta,
  ): Promise<TokenPair> {
    const tokenHash = hashOpaqueToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: USER_WITH_ROLES_INCLUDE } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotation: revoke the used token so it can't be replayed.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    if (!stored.user.isActive || stored.user.deletedAt) {
      throw new UnauthorizedException('Cuenta inactiva');
    }

    // Reuse the same Session across the whole rotation chain — a session is
    // one device/login, not one ephemeral refresh token.
    return this.issueTokenPair(stored.user, sessionMeta, stored.sessionId);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashOpaqueToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.revokedAt) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      ...(stored.sessionId
        ? [
            this.prisma.session.update({
              where: { id: stored.sessionId },
              data: { revokedAt: new Date() },
            }),
          ]
        : []),
    ]);
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Sesión no encontrada');
    }
    if (session.revokedAt) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always no-op silently for unknown/verified accounts: never reveal
    // whether an email is registered.
    if (!user || user.emailVerifiedAt) {
      return;
    }
    await this.sendVerificationEmail(user.id, user.email);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const record = await this.prisma.emailVerification.findUnique({
      where: { tokenHash },
    });

    if (!record || record.verifiedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Enlace de verificación inválido o expirado',
      );
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { verifiedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Same no-enumeration rule as resendVerification: silently no-op.
    if (!user || user.deletedAt || !user.isActive) {
      return;
    }

    const token = generateOpaqueToken();
    const expiresMs = parseDurationMs(this.mailConfig.passwordResetExpiresIn);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + expiresMs),
      },
    });

    const link = `${this.appUrl}/reset-password?token=${token}`;
    await this.sendMailSafely({
      to: user.email,
      subject: 'Recupera tu contraseña — Semana Santa de Timbío',
      html: `<p>Solicitaste restablecer tu contraseña. Este enlace vence en ${this.mailConfig.passwordResetExpiresIn}:</p><p><a href="${link}">${link}</a></p><p>Si no fuiste vos, ignorá este correo.</p>`,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Enlace de recuperación inválido o expirado',
      );
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      // A password reset invalidates every existing session: force re-login
      // everywhere the account may currently be logged in.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<void> {
    const token = generateOpaqueToken();
    const expiresMs = parseDurationMs(
      this.mailConfig.emailVerificationExpiresIn,
    );
    await this.prisma.emailVerification.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + expiresMs),
      },
    });

    const link = `${this.appUrl}/verify-email?token=${token}`;
    await this.sendMailSafely({
      to: email,
      subject: 'Confirma tu correo — Semana Santa de Timbío',
      html: `<p>Confirmá tu correo para activar tu cuenta. Este enlace vence en ${this.mailConfig.emailVerificationExpiresIn}:</p><p><a href="${link}">${link}</a></p>`,
    });
  }

  /** Registration/reset flows must not fail just because SMTP is down. */
  private async sendMailSafely(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.mailService.send(options);
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo a ${options.to}`,
        (error as Error).stack,
      );
    }
  }

  private async issueTokenPair(
    user: UserWithRoles,
    sessionMeta?: SessionMeta,
    existingSessionId?: string | null,
  ): Promise<TokenPair> {
    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtConfig.accessSecret,
      expiresIn: this.jwtConfig.accessExpiresIn as StringValue,
    });

    const refreshToken = generateOpaqueToken();
    const refreshExpiresMs = parseDurationMs(this.jwtConfig.refreshExpiresIn);
    const sessionExpiresAt = new Date(Date.now() + refreshExpiresMs);
    const sessionId = await this.upsertSession(
      user.id,
      existingSessionId,
      sessionMeta,
      sessionExpiresAt,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        sessionId,
        tokenHash: hashOpaqueToken(refreshToken),
        expiresAt: sessionExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(
        parseDurationMs(this.jwtConfig.accessExpiresIn) / 1000,
      ),
    };
  }

  /**
   * A Session represents one device/login, spanning the whole refresh-token
   * rotation chain. On login/register it creates a new one; on refresh it
   * extends the same one instead of spawning a new "device" per rotation.
   */
  private async upsertSession(
    userId: string,
    existingSessionId: string | null | undefined,
    meta: SessionMeta | undefined,
    expiresAt: Date,
  ): Promise<string> {
    if (existingSessionId) {
      const updated = await this.prisma.session.update({
        where: { id: existingSessionId },
        data: {
          expiresAt,
          userAgent: meta?.userAgent,
          ipAddress: meta?.ipAddress,
        },
      });
      return updated.id;
    }

    const created = await this.prisma.session.create({
      data: {
        userId,
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });
    return created.id;
  }

  private toAuthenticatedUser(user: UserWithRoles): AuthenticatedUser {
    return {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((ur) => ur.role.code),
      permissions: [
        ...new Set(
          user.roles.flatMap((ur) =>
            ur.role.permissions.map((rp) => rp.permission.code),
          ),
        ),
      ],
    };
  }
}
