import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BeneficiaryType,
  DonationStatus,
  DonorIdType,
  DonorVisibility,
  FinancialCategoryType,
} from '@prisma/client';
import { DonationReceiptsService } from './donation-receipts.service';
import { DonationsService } from './donations.service';
import { PrismaService } from '../prisma/prisma.service';

function buildAllocationsDto() {
  return [{ beneficiaryType: BeneficiaryType.JUNTA, amount: 100000 }];
}

describe('DonationsService', () => {
  let tx: {
    donation: {
      create: jest.Mock;
      update: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    donationStatusHistory: { create: jest.Mock };
    donationReceipt: { findUnique: jest.Mock; create: jest.Mock };
    financialCategory: { findFirst: jest.Mock; create: jest.Mock };
    financialTransaction: { findFirst: jest.Mock; create: jest.Mock };
    $executeRaw: jest.Mock;
  };
  let prisma: {
    donationCampaign: { findUnique: jest.Mock };
    person: { findUnique: jest.Mock };
    festival: { findUnique: jest.Mock };
    festivalEdition: { findUnique: jest.Mock };
    processionalStep: { findUnique: jest.Mock };
    event: { findUnique: jest.Mock };
    donation: { findUnique: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    donationReceipt: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let receipts: { deliverAfterConfirm: jest.Mock };
  let service: DonationsService;

  beforeEach(() => {
    tx = {
      donation: {
        create: jest.fn().mockResolvedValue({ id: 'donation-1' }),
        update: jest.fn().mockResolvedValue({}),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'donation-1' }),
      },
      donationStatusHistory: { create: jest.fn().mockResolvedValue({}) },
      donationReceipt: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
      financialCategory: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cat-donaciones' }),
        create: jest.fn().mockResolvedValue({ id: 'cat-new' }),
      },
      financialTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      donationCampaign: { findUnique: jest.fn() },
      person: { findUnique: jest.fn() },
      festival: { findUnique: jest.fn() },
      festivalEdition: { findUnique: jest.fn() },
      processionalStep: { findUnique: jest.fn() },
      event: { findUnique: jest.fn() },
      donation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      donationReceipt: { findUnique: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    receipts = { deliverAfterConfirm: jest.fn().mockResolvedValue(undefined) };
    service = new DonationsService(
      prisma as unknown as PrismaService,
      receipts as unknown as DonationReceiptsService,
    );
  });

  describe('create', () => {
    it('rejects an unknown campaignId', async () => {
      prisma.donationCampaign.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          campaignId: 'missing',
          amount: 100000,
          allocations: buildAllocationsDto(),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(tx.donation.create).not.toHaveBeenCalled();
    });

    it('rejects when allocations do not sum to amount', async () => {
      await expect(
        service.create({
          amount: 100000,
          allocations: [
            { beneficiaryType: BeneficiaryType.JUNTA, amount: 50000 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(tx.donation.create).not.toHaveBeenCalled();
    });

    it('rejects a FESTIVAL allocation whose beneficiary does not exist', async () => {
      prisma.festival.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          amount: 100000,
          allocations: [
            {
              beneficiaryType: BeneficiaryType.FESTIVAL,
              beneficiaryId: 'missing',
              amount: 100000,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(tx.donation.create).not.toHaveBeenCalled();
    });

    it('rejects a donor document that does not match its type', async () => {
      await expect(
        service.create({
          amount: 100000,
          donorIdType: DonorIdType.CC,
          donorIdNumber: '12AB',
          allocations: buildAllocationsDto(),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(tx.donation.create).not.toHaveBeenCalled();
    });

    it('stores a valid donor document', async () => {
      await service.create({
        amount: 100000,
        donorIdType: DonorIdType.CC,
        donorIdNumber: '1234567',
        allocations: buildAllocationsDto(),
      });
      expect(tx.donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            donorIdType: DonorIdType.CC,
            donorIdNumber: '1234567',
          }),
        }),
      );
    });

    it('allows JUNTA allocations without a beneficiaryId', async () => {
      await service.create({
        amount: 100000,
        donorVisibility: DonorVisibility.PUBLIC,
        allocations: buildAllocationsDto(),
      });
      expect(tx.donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 100000 }),
        }),
      );
    });

    it('splits a donation across multiple allocations that sum to the total', async () => {
      prisma.festival.findUnique.mockResolvedValue({ id: 'festival-1' });
      await service.create({
        amount: 100000,
        allocations: [
          { beneficiaryType: BeneficiaryType.JUNTA, amount: 40000 },
          {
            beneficiaryType: BeneficiaryType.FESTIVAL,
            beneficiaryId: 'festival-1',
            amount: 60000,
          },
        ],
      });
      expect(tx.donation.create).toHaveBeenCalled();
    });
  });

  describe('updateDonorDocument', () => {
    it('saves the document on a PENDING donation, attributing the actor', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });

      await service.updateDonorDocument(
        'd1',
        { donorIdType: DonorIdType.CC, donorIdNumber: '1234567' },
        'user-1',
      );

      expect(tx.$executeRaw).toHaveBeenCalled();
      expect(tx.donation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'd1' },
          data: { donorIdType: DonorIdType.CC, donorIdNumber: '1234567' },
        }),
      );
    });

    it('rejects once the donation is CONFIRMED (receipt already issued)', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.CONFIRMED,
      });
      await expect(
        service.updateDonorDocument(
          'd1',
          { donorIdType: DonorIdType.CC, donorIdNumber: '1234567' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(tx.donation.update).not.toHaveBeenCalled();
    });

    it('rejects a number that does not match the type', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      await expect(
        service.updateDonorDocument(
          'd1',
          { donorIdType: DonorIdType.NIT, donorIdNumber: 'ABC' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(tx.donation.update).not.toHaveBeenCalled();
    });

    it('404s for an unknown donation', async () => {
      prisma.donation.findUnique.mockResolvedValue(null);
      await expect(
        service.updateDonorDocument(
          'missing',
          { donorIdType: DonorIdType.CC, donorIdNumber: '1234567' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('throws when the donation does not exist', async () => {
      prisma.donation.findUnique.mockResolvedValue(null);
      await expect(service.confirm('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects confirming a donation that is not PENDING', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.CONFIRMED,
      });
      await expect(service.confirm('d1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('confirms a PENDING donation and issues a receipt', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      tx.donationReceipt.findUnique.mockResolvedValue(null);

      await service.confirm('d1', 'user-1', 'verificado manualmente');

      expect(tx.donation.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { status: DonationStatus.CONFIRMED },
      });
      expect(tx.donationReceipt.create).toHaveBeenCalledWith({
        data: { donationId: 'd1', taxIdSnapshot: null },
      });
      expect(receipts.deliverAfterConfirm).toHaveBeenCalledWith('d1');
    });

    it('does not deliver the receipt if the confirmation transaction fails', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      tx.donationReceipt.findUnique.mockResolvedValue(null);
      tx.financialTransaction.create.mockRejectedValue(new Error('db down'));

      await expect(service.confirm('d1', 'user-1')).rejects.toThrow('db down');
      expect(receipts.deliverAfterConfirm).not.toHaveBeenCalled();
    });

    it('does not duplicate the receipt if one already exists', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      tx.donationReceipt.findUnique.mockResolvedValue({ id: 'receipt-1' });

      await service.confirm('d1', 'user-1');

      expect(tx.donationReceipt.create).not.toHaveBeenCalled();
    });

    it('snapshots the donor document into the receipt', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
        donorIdType: DonorIdType.NIT,
        donorIdNumber: '900123456-7',
      });
      tx.donationReceipt.findUnique.mockResolvedValue(null);

      await service.confirm('d1', 'user-1');

      expect(tx.donationReceipt.create).toHaveBeenCalledWith({
        data: { donationId: 'd1', taxIdSnapshot: 'NIT 900123456-7' },
      });
    });

    it('books the donation as INCOME in the ledger, in the same transaction', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
        amount: 50000,
        currency: 'COP',
        campaignId: 'campaign-1',
      });
      tx.donationReceipt.findUnique.mockResolvedValue(null);

      await service.confirm('d1', 'user-1');

      expect(tx.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categoryId: 'cat-donaciones',
          type: FinancialCategoryType.INCOME,
          amount: 50000,
          currency: 'COP',
          relatedDonationId: 'd1',
          relatedCampaignId: 'campaign-1',
          createdByUserId: 'user-1',
        }),
      });
    });

    it('creates the Donaciones category on demand if the seed did not', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      tx.donationReceipt.findUnique.mockResolvedValue(null);
      tx.financialCategory.findFirst.mockResolvedValue(null);

      await service.confirm('d1', undefined);

      expect(tx.financialCategory.create).toHaveBeenCalledWith({
        data: { name: 'Donaciones', type: FinancialCategoryType.INCOME },
      });
      expect(tx.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ categoryId: 'cat-new' }),
      });
    });
  });

  describe('refund', () => {
    it('requires the donation to be CONFIRMED', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      await expect(service.refund('d1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('reverses the ledger INCOME entry with a compensating EXPENSE', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.CONFIRMED,
      });
      tx.financialTransaction.findFirst.mockResolvedValue({
        id: 'ft-1',
        categoryId: 'cat-donaciones',
        amount: 50000,
        currency: 'COP',
        relatedCampaignId: 'campaign-1',
      });

      await service.refund('d1', 'user-1', 'pedido del donante');

      expect(tx.donation.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { status: DonationStatus.REFUNDED },
      });
      expect(tx.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: FinancialCategoryType.EXPENSE,
          amount: 50000,
          relatedDonationId: 'd1',
          relatedCampaignId: 'campaign-1',
          reversalOfTransactionId: 'ft-1',
        }),
      });
    });

    it('still refunds a legacy donation that was never booked in the ledger', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.CONFIRMED,
      });

      await service.refund('d1', 'user-1');

      expect(tx.donation.update).toHaveBeenCalled();
      expect(tx.financialTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('requires the donation to be PENDING', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.CONFIRMED,
      });
      await expect(service.cancel('d1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markFailedIfPending', () => {
    it('does nothing if the donation is not PENDING', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.CONFIRMED,
      });
      await service.markFailedIfPending('d1', 'user-1');
      expect(tx.donation.update).not.toHaveBeenCalled();
    });

    it('transitions a PENDING donation to FAILED', async () => {
      prisma.donation.findUnique.mockResolvedValue({
        id: 'd1',
        status: DonationStatus.PENDING,
      });
      await service.markFailedIfPending('d1', 'user-1');
      expect(tx.donation.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { status: DonationStatus.FAILED },
      });
    });
  });

  describe('getReceipt', () => {
    it('404s when there is no receipt yet', async () => {
      prisma.donation.findUnique.mockResolvedValue({ id: 'd1' });
      prisma.donationReceipt.findUnique.mockResolvedValue(null);
      await expect(service.getReceipt('d1')).rejects.toThrow(NotFoundException);
    });
  });
});
