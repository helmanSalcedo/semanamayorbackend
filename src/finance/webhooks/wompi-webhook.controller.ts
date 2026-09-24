import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentTransactionStatus } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';
import type { AppConfig } from '../../config/configuration';
import { PaymentTransactionsService } from '../payment-transactions.service';
import { WompiEventPayload, verifyWompiSignature } from './signature.util';

const STATUS_MAP: Record<string, PaymentTransactionStatus> = {
  APPROVED: PaymentTransactionStatus.SUCCEEDED,
  DECLINED: PaymentTransactionStatus.FAILED,
  ERROR: PaymentTransactionStatus.FAILED,
  VOIDED: PaymentTransactionStatus.REFUNDED,
  PENDING: PaymentTransactionStatus.PENDING,
};

interface WompiTransactionEvent extends WompiEventPayload {
  event: string;
  data: {
    transaction: {
      id: string;
      status: string;
      amount_in_cents: number;
      currency: string;
      reference: string;
      payment_method_type?: string;
      finalized_at?: string;
    };
  };
}

/**
 * Receives Wompi's "Eventos" webhooks (transaction.updated). Signature
 * scheme implemented from Wompi's public docs (concat of signature.properties
 * + timestamp + EVENTS_SECRET, SHA256) — not yet exercised against Wompi's
 * real sandbox, only unit-tested against hand-computed checksums (see
 * signature.util.spec.ts). `reference` is expected to equal the donation's
 * own UUID, set when the checkout session was created.
 */
@ApiTags('finance')
@Controller('webhooks/wompi')
export class WompiWebhookController {
  constructor(
    private readonly paymentTransactionsService: PaymentTransactionsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de eventos de transacción de Wompi' })
  async handle(@Body() payload: WompiTransactionEvent) {
    const secret =
      this.configService.get<AppConfig>('app')!.paymentWebhooks
        .wompiEventsSecret;
    if (!secret) {
      throw new ServiceUnavailableException(
        'WOMPI_EVENTS_SECRET no está configurado',
      );
    }

    if (!verifyWompiSignature(payload, secret)) {
      throw new UnauthorizedException('Firma de Wompi inválida');
    }

    const tx = payload.data.transaction;
    const status = STATUS_MAP[tx.status];
    if (!status) {
      throw new BadRequestException(
        `Estado de Wompi no soportado: ${tx.status}`,
      );
    }

    await this.paymentTransactionsService.recordWebhookEvent({
      donationId: tx.reference,
      providerCode: 'WOMPI',
      externalTransactionId: tx.id,
      status,
      amount: tx.amount_in_cents / 100,
      currency: tx.currency,
      paymentMethodType: tx.payment_method_type,
      paidAt: tx.finalized_at ? new Date(tx.finalized_at) : undefined,
      metadata: tx,
    });

    return { received: true };
  }
}
