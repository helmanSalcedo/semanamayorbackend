import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SponsorableType } from '@prisma/client';
import { SponsorshipsService } from './sponsorships.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SponsorshipsService', () => {
  let prisma: {
    organization: { findUnique: jest.Mock };
    festival: { findUnique: jest.Mock };
    festivalEdition: { findUnique: jest.Mock };
    event: { findUnique: jest.Mock };
    processionalStep: { findUnique: jest.Mock };
    donationCampaign: { findUnique: jest.Mock };
    sponsorshipPackage: { findUnique: jest.Mock };
    sponsorship: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: SponsorshipsService;

  beforeEach(() => {
    prisma = {
      organization: { findUnique: jest.fn() },
      festival: { findUnique: jest.fn() },
      festivalEdition: { findUnique: jest.fn() },
      event: { findUnique: jest.fn() },
      processionalStep: { findUnique: jest.fn() },
      donationCampaign: { findUnique: jest.fn() },
      sponsorshipPackage: { findUnique: jest.fn() },
      sponsorship: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new SponsorshipsService(prisma as unknown as PrismaService);
  });

  const baseDto = {
    organizationId: 'org-1',
    sponsorableType: SponsorableType.FESTIVAL,
    sponsorableId: 'festival-1',
    startDate: '2027-01-01',
  };

  describe('create', () => {
    it('rejects an unknown organizationId', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.sponsorship.create).not.toHaveBeenCalled();
    });

    it('rejects when the sponsorable entity does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        deletedAt: null,
      });
      prisma.festival.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates the sponsorship when everything resolves', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        deletedAt: null,
      });
      prisma.festival.findUnique.mockResolvedValue({
        id: 'festival-1',
        deletedAt: null,
      });
      prisma.sponsorship.create.mockResolvedValue({ id: 'sp-1' });

      await service.create(baseDto);

      expect(prisma.sponsorship.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org-1',
            sponsorableType: SponsorableType.FESTIVAL,
            sponsorableId: 'festival-1',
          }),
        }),
      );
    });

    it('validates DONATION_CAMPAIGN sponsorables against donationCampaign', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        deletedAt: null,
      });
      prisma.donationCampaign.findUnique.mockResolvedValue({
        id: 'camp-1',
        deletedAt: null,
      });
      prisma.sponsorship.create.mockResolvedValue({ id: 'sp-1' });

      await service.create({
        ...baseDto,
        sponsorableType: SponsorableType.DONATION_CAMPAIGN,
        sponsorableId: 'camp-1',
      });

      expect(prisma.donationCampaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
      });
      expect(prisma.sponsorship.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('404s for a missing sponsorship', async () => {
      prisma.sponsorship.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });
});
