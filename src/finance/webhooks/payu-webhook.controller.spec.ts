import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PaymentTransactionsService } from '../payment-transactions.service';
import { PayuWebhookController } from './payu-webhook.controller';

describe('PayuWebhookController', () => {
  let paymentTransactionsService: { recordWebhookEvent: jest.Mock };
  let configService: { get: jest.Mock };
  let controller: PayuWebhookController;

  const apiKey = 'api-key';
  const merchantId = '999999';

  function buildBody(overrides: Record<string, unknown> = {}) {
    const base = {
      merchant_id: merchantId,
      reference_sale: 'donation-1',
      value: '20000.0',
      currency: 'COP',
      state_pol: '4',
      transaction_id: 'payu-tx-1',
    };
    const sign = createHash('md5')
      .update(
        [
          apiKey,
          base.merchant_id,
          base.reference_sale,
          base.value,
          base.currency,
          base.state_pol,
        ].join('~'),
        'utf8',
      )
      .digest('hex');
    return { ...base, sign, ...overrides };
  }

  beforeEach(() => {
    paymentTransactionsService = {
      recordWebhookEvent: jest.fn().mockResolvedValue({ id: 'pt-1' }),
    };
    configService = {
      get: jest.fn().mockReturnValue({
        paymentWebhooks: { payu: { apiKey, merchantId } },
      }),
    };
    controller = new PayuWebhookController(
      paymentTransactionsService as unknown as PaymentTransactionsService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects when PayU is not configured', async () => {
    configService.get.mockReturnValue({ paymentWebhooks: {} });
    await expect(controller.handle(buildBody() as never)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects a mismatched merchant_id', async () => {
    const body = buildBody({ merchant_id: 'other' });
    await expect(controller.handle(body as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an invalid signature', async () => {
    const body = buildBody({ sign: 'bad' });
    await expect(controller.handle(body as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('records the event when the signature is valid', async () => {
    const body = buildBody();
    await controller.handle(body);

    expect(paymentTransactionsService.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        donationId: 'donation-1',
        providerCode: 'PAYU',
        externalTransactionId: 'payu-tx-1',
        amount: 20000,
        currency: 'COP',
      }),
    );
  });
});
