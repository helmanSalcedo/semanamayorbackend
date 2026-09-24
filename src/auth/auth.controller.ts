import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService, SessionMeta } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthenticatedUser } from './types/jwt-payload.interface';

function sessionMetaFrom(req: Request): SessionMeta {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
}

const GENERIC_OK = {
  message: 'Si la solicitud es válida, recibirás un correo en breve',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Crea una cuenta nueva (rol VIEWER por defecto)' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, sessionMetaFrom(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión y devuelve access + refresh token' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, sessionMetaFrom(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rota un refresh token válido por un par nuevo' })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto.refreshToken, sessionMetaFrom(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoca un refresh token y su sesión' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.authService.logout(dto.refreshToken, sessionMetaFrom(req));
  }

  @Get('me')
  @ApiOperation({ summary: 'Devuelve la identidad del usuario autenticado' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualiza mi propio nombre/teléfono' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Cambia mi contraseña estando logueado (requiere la actual); cierra todas mis sesiones',
  })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user.sub, dto);
  }

  @Get('sessions')
  @ApiOperation({
    summary: 'Lista mis sesiones activas (dispositivo, IP, expiración)',
  })
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.sub);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Cierra una sesión remota (revoca su refresh token; el access token en curso expira solo)',
  })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.authService.revokeSession(user.sub, id);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirma el correo a partir del token enviado por email',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Correo confirmado' };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenvía el correo de confirmación (respuesta genérica siempre)',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto.email);
    return GENERIC_OK;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicia recuperación de contraseña (respuesta genérica siempre)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return GENERIC_OK;
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Establece una nueva contraseña a partir del token de recuperación',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Contraseña actualizada' };
  }
}
