import { NotFoundException } from '@nestjs/common';
import { AdvertisementPlacementsService } from './advertisement-placements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdvertisementPlacementsService', () => {
  let prisma: {
    advertisementPlacement: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    advertisement: { findUnique: jest.Mock };
  };
  let service: AdvertisementPlacementsService;

  beforeEach(() => {
    prisma = {
      advertisementPlacement: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      advertisement: { findUnique: jest.fn() },
    };
    service = new AdvertisementPlacementsService(
      prisma as unknown as PrismaService,
    );
  });

  describe('add', () => {
    it('404s when the advertisement does not exist', async () => {
      prisma.advertisement.findUnique.mockResolvedValue(null);
      await expect(
        service.add('missing', {
          placementZone: 'home_banner',
          startDate: '2027-01-01',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.advertisementPlacement.create).not.toHaveBeenCalled();
    });
  });

  describe('recordImpression', () => {
    it('increments the impressions counter', async () => {
      prisma.advertisementPlacement.findUnique.mockResolvedValue({
        id: 'pl-1',
      });
      await service.recordImpression('pl-1');
      expect(prisma.advertisementPlacement.update).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        data: { impressions: { increment: 1 } },
      });
    });

    it('404s for a missing placement', async () => {
      prisma.advertisementPlacement.findUnique.mockResolvedValue(null);
      await expect(service.recordImpression('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordClick', () => {
    it('increments the clicks counter', async () => {
      prisma.advertisementPlacement.findUnique.mockResolvedValue({
        id: 'pl-1',
      });
      await service.recordClick('pl-1');
      expect(prisma.advertisementPlacement.update).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        data: { clicks: { increment: 1 } },
      });
    });
  });
});
