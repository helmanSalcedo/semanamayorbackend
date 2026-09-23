import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdvertisementType } from '@prisma/client';
import { AdvertisementCampaignsService } from './advertisement-campaigns.service';
import { AdvertisementsService } from './advertisements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdvertisementsService', () => {
  let prisma: {
    advertisement: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    mediaAsset: { findUnique: jest.Mock };
  };
  let campaignsService: { findOne: jest.Mock };
  let service: AdvertisementsService;

  beforeEach(() => {
    prisma = {
      advertisement: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      mediaAsset: { findUnique: jest.fn() },
    };
    campaignsService = { findOne: jest.fn().mockResolvedValue({ id: 'camp-1' }) };
    service = new AdvertisementsService(
      prisma as unknown as PrismaService,
      campaignsService as unknown as AdvertisementCampaignsService,
    );
  });

  describe('create', () => {
    it('rejects an unknown creativeMediaAssetId', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create('camp-1', {
          type: AdvertisementType.BANNER,
          creativeMediaAssetId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.advertisement.create).not.toHaveBeenCalled();
    });

    it('creates the advertisement when the campaign exists', async () => {
      prisma.advertisement.create.mockResolvedValue({ id: 'ad-1' });
      await service.create('camp-1', { type: AdvertisementType.BANNER });
      expect(campaignsService.findOne).toHaveBeenCalledWith('camp-1');
      expect(prisma.advertisement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ campaignId: 'camp-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s when the ad does not belong to the campaign', async () => {
      prisma.advertisement.findUnique.mockResolvedValue({
        id: 'ad-1',
        campaignId: 'other-campaign',
      });
      await expect(service.findOne('camp-1', 'ad-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
