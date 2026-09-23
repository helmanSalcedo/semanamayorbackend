import { BadRequestException, NotFoundException } from '@nestjs/common';
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
});
