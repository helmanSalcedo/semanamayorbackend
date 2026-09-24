import { BadRequestException } from '@nestjs/common';
import { PaymentTransactionStatus } from '@prisma/client';
import { PaymentTransactionsService } from './payment-transactions.service';
import { DonationsService } from './donations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentTransactionsService', () => {
  let tx: { paymentTransaction: { create: jest.Mock }; $executeRaw: jest.Mock };
  let prisma: {
    paymentProvider: { findUnique: jest.Mock };
    paymentTransaction: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let donationsService: {
    findOne: jest.Mock;
    confirm: jest.Mock;
    markFailedIfPending: jest.Mock;
    refund: jest.Mock;
  };
  let service: PaymentTransactionsService;

  beforeEach(() => {
    tx = {
      paymentTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'pt-1' }),
      },
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      paymentProvider: { findUnique: jest.fn() },
      paymentTransaction: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    donationsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'donation-1' }),
      confirm: jest.fn().mockResolvedValue({}),
      markFailedIfPending: jest.fn().mockResolvedValue(undefined),
      refund: jest.fn().mockResolvedValue({}),
    };
    service = new PaymentTransactionsService(
      prisma as unknown as PrismaService,
      donationsService as unknown as DonationsService,
    );
  });

  describe('create', () => {
    it('rejects an unknown providerCode', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      await expect(
        service.create(
          'donation-1',
          {
            providerCode: 'BOGUS',
            status: PaymentTransactionStatus.PENDING,
            amount: 100000,
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(tx.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('confirms the donation when the payment SUCCEEDED', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue({
        id: 'provider-1',
        code: 'WOMPI',
      });
      await service.create(
        'donation-1',
        {
          providerCode: 'WOMPI',
          status: PaymentTransactionStatus.SUCCEEDED,
          amount: 100000,
        },
        'user-1',
      );
      expect(donationsService.confirm).toHaveBeenCalledWith(
        'donation-1',
        'user-1',
        expect.any(String),
      );
      expect(donationsService.markFailedIfPending).not.toHaveBeenCalled();
    });

    it('marks the donation as failed when the payment FAILED', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue({
        id: 'provider-1',
        code: 'WOMPI',
      });
      await service.create(
        'donation-1',
        {
          providerCode: 'WOMPI',
          status: PaymentTransactionStatus.FAILED,
          amount: 100000,
        },
        'user-1',
      );
      expect(donationsService.markFailedIfPending).toHaveBeenCalledWith(
        'donation-1',
        'user-1',
        expect.any(String),
      );
    });

    it('refunds the donation when the payment was REFUNDED', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue({
        id: 'provider-1',
        code: 'WOMPI',
      });
      await service.create(
        'donation-1',
        {
          providerCode: 'WOMPI',
          status: PaymentTransactionStatus.REFUNDED,
          amount: 100000,
        },
        'user-1',
      );
      expect(donationsService.refund).toHaveBeenCalledWith(
        'donation-1',
        'user-1',
        expect.any(String),
      );
    });

    it('does nothing to the donation when the payment is still PENDING', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue({
        id: 'provider-1',
        code: 'WOMPI',
      });
      await service.create(
        'donation-1',
        {
          providerCode: 'WOMPI',
          status: PaymentTransactionStatus.PENDING,
          amount: 100000,
        },
        'user-1',
      );
      expect(donationsService.confirm).not.toHaveBeenCalled();
      expect(donationsService.markFailedIfPending).not.toHaveBeenCalled();
      expect(donationsService.refund).not.toHaveBeenCalled();
    });
  });

  describe('recordWebhookEvent', () => {
    const baseParams = {
      donationId: 'donation-1',
      providerCode: 'WOMPI',
      externalTransactionId: 'wompi-tx-1',
      status: PaymentTransactionStatus.SUCCEEDED,
      amount: 20000,
      currency: 'COP',
    };

    it('rejects an unknown providerCode', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue(null);
      await expect(service.recordWebhookEvent(baseParams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('is idempotent: returns the existing transaction instead of creating a duplicate', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue({
        id: 'provider-1',
        code: 'WOMPI',
      });
      prisma.paymentTransaction.findUnique.mockResolvedValue({
        id: 'existing-pt',
      });

      const result = await service.recordWebhookEvent(baseParams);

      expect(result).toEqual({ id: 'existing-pt' });
      expect(tx.paymentTransaction.create).not.toHaveBeenCalled();
      expect(donationsService.confirm).not.toHaveBeenCalled();
    });

    it('creates the transaction and applies the donation side effect for a new event', async () => {
      prisma.paymentProvider.findUnique.mockResolvedValue({
        id: 'provider-1',
        code: 'WOMPI',
      });
      prisma.paymentTransaction.findUnique.mockResolvedValue(null);
      tx.paymentTransaction.create.mockResolvedValue({ id: 'new-pt' });

      const result = await service.recordWebhookEvent(baseParams);

      expect(result).toEqual({ id: 'new-pt' });
      expect(donationsService.confirm).toHaveBeenCalledWith(
        'donation-1',
        undefined,
        expect.any(String),
      );
    });
  });
});
