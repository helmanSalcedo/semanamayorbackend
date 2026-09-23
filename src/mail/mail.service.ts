import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { AppConfig } from '../config/configuration';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sin SMTP_HOST configurado (dev/test por defecto) esto escribe el correo al
 * log en vez de enviarlo, para no depender de un proveedor real en local.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly mailConfig: AppConfig['mail'];

  constructor(configService: ConfigService) {
    this.mailConfig = configService.get<AppConfig>('app')!.mail;
  }

  onModuleInit(): void {
    if (!this.mailConfig.smtp) {
      this.logger.warn(
        'SMTP_HOST no configurado: los correos se escribirán al log',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.mailConfig.smtp.host,
      port: this.mailConfig.smtp.port,
      secure: this.mailConfig.smtp.secure,
      auth: this.mailConfig.smtp.user
        ? {
            user: this.mailConfig.smtp.user,
            pass: this.mailConfig.smtp.password,
          }
        : undefined,
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[mail:dev] to=${options.to} subject="${options.subject}"\n${options.html}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.mailConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
