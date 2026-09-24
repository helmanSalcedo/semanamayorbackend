import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DonationStatus, Prisma } from '@prisma/client';
import { DonationCampaignsService } from './donation-campaigns.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DonationCampaignsService', () => {
  let prisma: {
    festival: { findUnique: jest.Mock };
    donationCampaign: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    donation: { aggregate: jest.Mock };
  };
  let service: DonationCampaignsService;

  beforeEach(() => {
    prisma = {
      festival: { findUnique: jest.fn() },
      donationCampaign: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      donation: { aggregate: jest.fn() },
    };
    service = new DonationCampaignsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown festivalId', async () => {
      prisma.festival.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Restauración 2027', festivalId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.donationCampaign.create).not.toHaveBeenCalled();
    });

    it('derives the slug from the name', async () => {
      prisma.donationCampaign.create.mockResolvedValue({});
      await service.create({ name: 'Restauración del Nazareno' });
      expect(prisma.donationCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'restauracion-del-nazareno' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted campaign', async () => {
      prisma.donationCampaign.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the campaign', async () => {
      prisma.donationCampaign.findUnique.mockResolvedValue({
        id: 'c1',
        deletedAt: null,
      });
      prisma.donationCampaign.update.mockResolvedValue({});
      await service.remove('c1');
      expect(prisma.donationCampaign.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('getProgress', () => {
    it('sums only CONFIRMED donations and computes the goal percentage', async () => {
      prisma.donationCampaign.findUnique.mockResolvedValue({
        id: 'c1',
        currency: 'COP',
        goalAmount: new Prisma.Decimal(1000000),
        deletedAt: null,
      });
      prisma.donation.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(250000) },
        _count: { _all: 3 },
      });

      const progress = await service.getProgress('c1');

      expect(prisma.donation.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'c1', status: DonationStatus.CONFIRMED },
        }),
      );
      expect(progress.raisedAmount.toString()).toBe('250000');
      expect(progress.donationCount).toBe(3);
      expect(progress.percentage?.toString()).toBe('25');
    });

    it('returns zero raised and null percentage when there is no goal', async () => {
      prisma.donationCampaign.findUnique.mockResolvedValue({
        id: 'c1',
        currency: 'COP',
        goalAmount: null,
        deletedAt: null,
      });
      prisma.donation.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: { _all: 0 },
      });

      const progress = await service.getProgress('c1');

      expect(progress.raisedAmount.toString()).toBe('0');
      expect(progress.percentage).toBeNull();
    });
  });
});
