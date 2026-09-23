import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdvertisementCampaignsService } from './advertisement-campaigns.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdvertisementCampaignsService', () => {
  let prisma: {
    advertisementCampaign: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    organization: { findUnique: jest.Mock };
  };
  let service: AdvertisementCampaignsService;

  beforeEach(() => {
    prisma = {
      advertisementCampaign: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      organization: { findUnique: jest.fn() },
    };
    service = new AdvertisementCampaignsService(
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('rejects an unknown organizationId', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          organizationId: 'missing',
          name: 'Campaña',
          startDate: '2027-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.advertisementCampaign.create).not.toHaveBeenCalled();
    });

    it('creates the campaign when the organization exists', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        deletedAt: null,
      });
      prisma.advertisementCampaign.create.mockResolvedValue({ id: 'camp-1' });

      await service.create({
        organizationId: 'org-1',
        name: 'Campaña',
        startDate: '2027-01-01',
      });

      expect(prisma.advertisementCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: 'org-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing campaign', async () => {
      prisma.advertisementCampaign.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });
});
