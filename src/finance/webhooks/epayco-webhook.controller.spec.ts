import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PaymentTransactionsService } from '../payment-transactions.service';
import { EpaycoWebhookController } from './epayco-webhook.controller';

describe('EpaycoWebhookController', () => {
  let paymentTransactionsService: { recordWebhookEvent: jest.Mock };
  let configService: { get: jest.Mock };
  let controller: EpaycoWebhookController;

  const custIdCliente = 'cust-id';
  const pKey = 'p-key';

  function buildBody(overrides: Record<string, unknown> = {}) {
    const base = {
      x_id_invoice: 'donation-1',
      x_ref_payco: 'ref-1',
      x_transaction_id: 'epayco-tx-1',
      x_amount: '20000.00',
      x_currency_code: 'COP',
      x_transaction_state: 'Aceptada',
    };
    const x_signature = createHash('sha256')
      .update(
        [
          custIdCliente,
          pKey,
          base.x_ref_payco,
          base.x_transaction_id,
          base.x_amount,
          base.x_currency_code,
        ].join('^'),
        'utf8',
      )
      .digest('hex');
    return { ...base, x_signature, ...overrides };
  }

  beforeEach(() => {
    paymentTransactionsService = {
      recordWebhookEvent: jest.fn().mockResolvedValue({ id: 'pt-1' }),
    };
    configService = {
      get: jest.fn().mockReturnValue({
        paymentWebhooks: { epayco: { custIdCliente, pKey } },
      }),
    };
    controller = new EpaycoWebhookController(
      paymentTransactionsService as unknown as PaymentTransactionsService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects when ePayco is not configured', async () => {
    configService.get.mockReturnValue({ paymentWebhooks: {} });
    await expect(controller.handle(buildBody() as never)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects an invalid signature', async () => {
    const body = buildBody({ x_signature: 'bad' });
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
        providerCode: 'EPAYCO',
        externalTransactionId: 'epayco-tx-1',
        amount: 20000,
        currency: 'COP',
      }),
    );
  });
});
