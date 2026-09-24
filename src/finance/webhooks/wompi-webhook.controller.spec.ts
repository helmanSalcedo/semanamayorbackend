import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PaymentTransactionsService } from '../payment-transactions.service';
import { WompiWebhookController } from './wompi-webhook.controller';

describe('WompiWebhookController', () => {
  let paymentTransactionsService: { recordWebhookEvent: jest.Mock };
  let configService: { get: jest.Mock };
  let controller: WompiWebhookController;

  const secret = 'events-secret';

  function buildPayload(overrides: Record<string, unknown> = {}) {
    const data = {
      transaction: {
        id: 'wompi-tx-1',
        status: 'APPROVED',
        amount_in_cents: 2000000,
        currency: 'COP',
        reference: 'donation-1',
      },
    };
    const properties = ['transaction.id', 'transaction.status'];
    const timestamp = 1700000000;
    const checksum = createHash('sha256')
      .update(
        String(data.transaction.id) +
          String(data.transaction.status) +
          String(timestamp) +
          secret,
        'utf8',
      )
      .digest('hex');
    return {
      event: 'transaction.updated',
      data,
      timestamp,
      signature: { properties, checksum },
      ...overrides,
    };
  }

  beforeEach(() => {
    paymentTransactionsService = {
      recordWebhookEvent: jest.fn().mockResolvedValue({ id: 'pt-1' }),
    };
    configService = {
      get: jest.fn().mockReturnValue({
        paymentWebhooks: { wompiEventsSecret: secret },
      }),
    };
    controller = new WompiWebhookController(
      paymentTransactionsService as unknown as PaymentTransactionsService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects when the secret is not configured', async () => {
    configService.get.mockReturnValue({ paymentWebhooks: {} });
    await expect(controller.handle(buildPayload() as never)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects an invalid signature', async () => {
    const payload = buildPayload({
      signature: { properties: ['transaction.id'], checksum: 'bad' },
    });
    await expect(controller.handle(payload as never)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('records the event when the signature is valid', async () => {
    const payload = buildPayload();
    await controller.handle(payload);

    expect(paymentTransactionsService.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        donationId: 'donation-1',
        providerCode: 'WOMPI',
        externalTransactionId: 'wompi-tx-1',
        amount: 20000,
        currency: 'COP',
      }),
    );
  });
});
