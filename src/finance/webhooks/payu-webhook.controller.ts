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
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentTransactionStatus } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';
import type { AppConfig } from '../../config/configuration';
import { PaymentTransactionsService } from '../payment-transactions.service';
import { verifyPayuSignature } from './signature.util';

const STATE_POL_MAP: Record<string, PaymentTransactionStatus> = {
  '4': PaymentTransactionStatus.SUCCEEDED,
  '6': PaymentTransactionStatus.FAILED,
  '5': PaymentTransactionStatus.FAILED,
  '104': PaymentTransactionStatus.FAILED,
  '7': PaymentTransactionStatus.PENDING,
};

interface PayuConfirmationBody {
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  state_pol: string;
  sign: string;
  transaction_id: string;
  payment_method_type?: string;
}

/**
 * Receives PayU Latam's "confirmación de transacción" webhook (form-encoded
 * POST). Signature scheme from PayU's public docs — the `value` formatting
 * PayU expects for the signature has known real-world gotchas (trailing
 * zeros/decimal precision) that this implementation has NOT been verified
 * against PayU's actual sandbox; re-check against a real PayU test
 * transaction before relying on this in production. `reference_sale` is
 * expected to equal the donation's own UUID.
 */
@ApiTags('finance')
@Controller('webhooks/payu')
export class PayuWebhookController {
  constructor(
    private readonly paymentTransactionsService: PaymentTransactionsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de confirmación de transacción de PayU' })
  async handle(@Body() body: PayuConfirmationBody) {
    const payu = this.configService.get<AppConfig>('app')!.paymentWebhooks.payu;
    if (!payu) {
      throw new ServiceUnavailableException(
        'PAYU_API_KEY/PAYU_MERCHANT_ID no están configurados',
      );
    }

    if (body.merchant_id !== payu.merchantId) {
      throw new UnauthorizedException('merchant_id de PayU no coincide');
    }

    const valid = verifyPayuSignature(
      {
        merchantId: body.merchant_id,
        referenceCode: body.reference_sale,
        value: body.value,
        currency: body.currency,
        statePol: body.state_pol,
        sign: body.sign,
      },
      payu.apiKey,
    );
    if (!valid) {
      throw new UnauthorizedException('Firma de PayU inválida');
    }

    const status = STATE_POL_MAP[body.state_pol];
    if (!status) {
      throw new BadRequestException(
        `state_pol de PayU no soportado: ${body.state_pol}`,
      );
    }

    await this.paymentTransactionsService.recordWebhookEvent({
      donationId: body.reference_sale,
      providerCode: 'PAYU',
      externalTransactionId: body.transaction_id,
      status,
      amount: Number(body.value),
      currency: body.currency,
      paymentMethodType: body.payment_method_type,
      metadata: body as unknown as Record<string, unknown>,
    });

    return { received: true };
  }
}
