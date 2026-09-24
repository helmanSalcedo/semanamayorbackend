import { createHash } from 'crypto';
import {
  EpaycoConfirmationPayload,
  PayuConfirmationPayload,
  WompiEventPayload,
  verifyEpaycoSignature,
  verifyPayuSignature,
  verifyWompiSignature,
} from './signature.util';

describe('verifyWompiSignature', () => {
  const secret = 'test-events-secret';

  function sign(
    payload: Omit<WompiEventPayload, 'signature'> & {
      properties: string[];
    },
  ): string {
    const concatenated = payload.properties
      .map((p) => {
        const value = p
          .split('.')
          .reduce<unknown>((acc, k) => (acc as never)?.[k], payload.data);
        return typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : '';
      })
      .join('');
    return createHash('sha256')
      .update(concatenated + String(payload.timestamp) + secret, 'utf8')
      .digest('hex');
  }

  it('accepts a correctly computed checksum', () => {
    const data = { transaction: { id: 'tx-1', status: 'APPROVED' } };
    const properties = ['transaction.id', 'transaction.status'];
    const timestamp = 1700000000;
    const checksum = sign({ data, properties, timestamp });

    const payload: WompiEventPayload = {
      data,
      timestamp,
      signature: { properties, checksum },
    };

    expect(verifyWompiSignature(payload, secret)).toBe(true);
  });

  it('rejects a tampered payload (amount changed after signing)', () => {
    const data = { transaction: { id: 'tx-1', amount_in_cents: 100000 } };
    const properties = ['transaction.id', 'transaction.amount_in_cents'];
    const timestamp = 1700000000;
    const checksum = sign({ data, properties, timestamp });

    const tampered: WompiEventPayload = {
      data: { transaction: { id: 'tx-1', amount_in_cents: 999999999 } },
      timestamp,
      signature: { properties, checksum },
    };

    expect(verifyWompiSignature(tampered, secret)).toBe(false);
  });

  it('rejects the right checksum with the wrong secret', () => {
    const data = { transaction: { id: 'tx-1' } };
    const properties = ['transaction.id'];
    const timestamp = 1700000000;
    const checksum = sign({ data, properties, timestamp });

    const payload: WompiEventPayload = {
      data,
      timestamp,
      signature: { properties, checksum },
    };

    expect(verifyWompiSignature(payload, 'wrong-secret')).toBe(false);
  });
});

describe('verifyPayuSignature', () => {
  const apiKey = 'test-api-key';

  function sign(p: Omit<PayuConfirmationPayload, 'sign'>): string {
    return createHash('md5')
      .update(
        [
          apiKey,
          p.merchantId,
          p.referenceCode,
          p.value,
          p.currency,
          p.statePol,
        ].join('~'),
        'utf8',
      )
      .digest('hex');
  }

  it('accepts a correctly computed signature', () => {
    const base = {
      merchantId: '999999',
      referenceCode: 'donation-abc',
      value: '20000.0',
      currency: 'COP',
      statePol: '4',
    };
    const payload: PayuConfirmationPayload = { ...base, sign: sign(base) };
    expect(verifyPayuSignature(payload, apiKey)).toBe(true);
  });

  it('rejects a tampered value', () => {
    const base = {
      merchantId: '999999',
      referenceCode: 'donation-abc',
      value: '20000.0',
      currency: 'COP',
      statePol: '4',
    };
    const sign_ = sign(base);
    const tampered: PayuConfirmationPayload = {
      ...base,
      value: '1.0',
      sign: sign_,
    };
    expect(verifyPayuSignature(tampered, apiKey)).toBe(false);
  });
});

describe('verifyEpaycoSignature', () => {
  const custIdCliente = 'test-cust-id';
  const pKey = 'test-p-key';

  function sign(p: Omit<EpaycoConfirmationPayload, 'xSignature'>): string {
    return createHash('sha256')
      .update(
        [
          custIdCliente,
          pKey,
          p.xRefPayco,
          p.xTransactionId,
          p.xAmount,
          p.xCurrencyCode,
        ].join('^'),
        'utf8',
      )
      .digest('hex');
  }

  it('accepts a correctly computed signature', () => {
    const base = {
      xRefPayco: 'ref-1',
      xTransactionId: 'txn-1',
      xAmount: '20000.00',
      xCurrencyCode: 'COP',
    };
    const payload: EpaycoConfirmationPayload = {
      ...base,
      xSignature: sign(base),
    };
    expect(verifyEpaycoSignature(payload, custIdCliente, pKey)).toBe(true);
  });

  it('rejects when the amount was tampered after signing', () => {
    const base = {
      xRefPayco: 'ref-1',
      xTransactionId: 'txn-1',
      xAmount: '20000.00',
      xCurrencyCode: 'COP',
    };
    const signature = sign(base);
    const tampered: EpaycoConfirmationPayload = {
      ...base,
      xAmount: '1.00',
      xSignature: signature,
    };
    expect(verifyEpaycoSignature(tampered, custIdCliente, pKey)).toBe(false);
  });
});
