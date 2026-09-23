import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinancialCategoryType } from '@prisma/client';
import { FinancialTransactionsService } from './financial-transactions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinancialTransactionsService', () => {
  let tx: {
    financialTransaction: { create: jest.Mock };
    $executeRaw: jest.Mock;
  };
  let prisma: {
    financialCategory: { findUnique: jest.Mock };
    donation: { findUnique: jest.Mock };
    donationCampaign: { findUnique: jest.Mock };
    financialTransaction: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: FinancialTransactionsService;

  beforeEach(() => {
    tx = {
      financialTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'ft-2' }),
      },
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      financialCategory: { findUnique: jest.fn() },
      donation: { findUnique: jest.fn() },
      donationCampaign: { findUnique: jest.fn() },
      financialTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    service = new FinancialTransactionsService(
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('rejects an unknown categoryId', async () => {
      prisma.financialCategory.findUnique.mockResolvedValue(null);
      await expect(
        service.create(
          {
            categoryId: 'missing',
            type: FinancialCategoryType.EXPENSE,
            amount: 1000,
            occurredAt: '2027-01-01',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(tx.financialTransaction.create).not.toHaveBeenCalled();
    });

    it('creates the entry when the category exists', async () => {
      prisma.financialCategory.findUnique.mockResolvedValue({ id: 'cat-1' });
      await service.create(
        {
          categoryId: 'cat-1',
          type: FinancialCategoryType.INCOME,
          amount: 1000,
          occurredAt: '2027-01-01',
        },
        'user-1',
      );
      expect(tx.financialTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: 'cat-1',
            createdByUserId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('reverse', () => {
    it('404s when the original transaction does not exist', async () => {
      prisma.financialTransaction.findUnique.mockResolvedValue(null);
      await expect(service.reverse('missing', {}, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects reversing an already-reversed transaction', async () => {
      prisma.financialTransaction.findUnique.mockResolvedValue({
        id: 'ft-1',
        categoryId: 'cat-1',
        type: FinancialCategoryType.INCOME,
        amount: 1000,
        currency: 'COP',
      });
      prisma.financialTransaction.findFirst.mockResolvedValue({
        id: 'ft-existing-reversal',
      });

      await expect(service.reverse('ft-1', {}, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(tx.financialTransaction.create).not.toHaveBeenCalled();
    });

    it('creates an opposite-type entry referencing the original', async () => {
      prisma.financialTransaction.findUnique.mockResolvedValue({
        id: 'ft-1',
        categoryId: 'cat-1',
        type: FinancialCategoryType.INCOME,
        amount: 1000,
        currency: 'COP',
        relatedDonationId: null,
        relatedCampaignId: null,
      });
      prisma.financialTransaction.findFirst.mockResolvedValue(null);

      await service.reverse('ft-1', {}, 'user-1');

      expect(tx.financialTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: FinancialCategoryType.EXPENSE,
            amount: 1000,
            reversalOfTransactionId: 'ft-1',
          }),
        }),
      );
    });
  });
});
