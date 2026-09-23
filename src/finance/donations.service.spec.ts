import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BeneficiaryType,
  DonationStatus,
  DonorVisibility,
} from '@prisma/client';
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
    service = new DonationsService(prisma as unknown as PrismaService);
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
        data: { donationId: 'd1' },
      });
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
