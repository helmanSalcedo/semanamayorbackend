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
import { verifyEpaycoSignature } from './signature.util';

const STATE_MAP: Record<string, PaymentTransactionStatus> = {
  Aceptada: PaymentTransactionStatus.SUCCEEDED,
  Rechazada: PaymentTransactionStatus.FAILED,
  Fallida: PaymentTransactionStatus.FAILED,
  Expirada: PaymentTransactionStatus.FAILED,
  Pendiente: PaymentTransactionStatus.PENDING,
  Reversada: PaymentTransactionStatus.REFUNDED,
  Devuelta: PaymentTransactionStatus.REFUNDED,
};

interface EpaycoConfirmationBody {
  x_id_invoice: string;
  x_ref_payco: string;
  x_transaction_id: string;
  x_amount: string;
  x_currency_code: string;
  x_signature: string;
  x_transaction_state: string;
  x_franchise?: string;
}

/**
 * Receives ePayco's "confirmación" webhook (form-encoded POST). Signature
 * scheme from ePayco's public docs — not yet exercised against ePayco's
 * real sandbox, only unit-tested against hand-computed checksums. `x_id_invoice`
 * is expected to equal the donation's own UUID.
 */
@ApiTags('finance')
@Controller('webhooks/epayco')
export class EpaycoWebhookController {
  constructor(
    private readonly paymentTransactionsService: PaymentTransactionsService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de confirmación de transacción de ePayco' })
  async handle(@Body() body: EpaycoConfirmationBody) {
    const epayco =
      this.configService.get<AppConfig>('app')!.paymentWebhooks.epayco;
    if (!epayco) {
      throw new ServiceUnavailableException(
        'EPAYCO_P_KEY/EPAYCO_P_CUST_ID_CLIENTE no están configurados',
      );
    }

    const valid = verifyEpaycoSignature(
      {
        xRefPayco: body.x_ref_payco,
        xTransactionId: body.x_transaction_id,
        xAmount: body.x_amount,
        xCurrencyCode: body.x_currency_code,
        xSignature: body.x_signature,
      },
      epayco.custIdCliente,
      epayco.pKey,
    );
    if (!valid) {
      throw new UnauthorizedException('Firma de ePayco inválida');
    }

    const status = STATE_MAP[body.x_transaction_state];
    if (!status) {
      throw new BadRequestException(
        `x_transaction_state de ePayco no soportado: ${body.x_transaction_state}`,
      );
    }

    await this.paymentTransactionsService.recordWebhookEvent({
      donationId: body.x_id_invoice,
      providerCode: 'EPAYCO',
      externalTransactionId: body.x_transaction_id,
      status,
      amount: Number(body.x_amount),
      currency: body.x_currency_code,
      paymentMethodType: body.x_franchise,
      metadata: body as unknown as Record<string, unknown>,
    });

    return { received: true };
  }
}
