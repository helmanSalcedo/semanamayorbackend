import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusinessLocationsService } from './business-locations.service';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BusinessLocationsService', () => {
  let prisma: {
    businessLocation: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    municipality: { findUnique: jest.Mock };
  };
  let businessesService: { findOne: jest.Mock };
  let service: BusinessLocationsService;

  beforeEach(() => {
    prisma = {
      businessLocation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      municipality: { findUnique: jest.fn() },
    };
    businessesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'biz-1' }),
    };
    service = new BusinessLocationsService(
      prisma as unknown as PrismaService,
      businessesService as unknown as BusinessesService,
    );
  });

  describe('add', () => {
    it('rejects an unknown municipalityId', async () => {
      prisma.municipality.findUnique.mockResolvedValue(null);
      await expect(
        service.add('biz-1', { municipalityId: 'missing', address: 'Cra 1' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.businessLocation.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('404s when the location does not belong to the business', async () => {
      prisma.businessLocation.findUnique.mockResolvedValue({
        id: 'loc-1',
        businessId: 'other-business',
      });
      await expect(service.remove('biz-1', 'loc-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
