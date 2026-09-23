import { NotFoundException } from '@nestjs/common';
import { SponsorshipPackagesService } from './sponsorship-packages.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SponsorshipPackagesService', () => {
  let prisma: {
    sponsorshipPackage: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: SponsorshipPackagesService;

  beforeEach(() => {
    prisma = {
      sponsorshipPackage: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new SponsorshipPackagesService(
      prisma as unknown as PrismaService,
    );
  });

  describe('findOne', () => {
    it('404s for a missing package', async () => {
      prisma.sponsorshipPackage.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the package once found', async () => {
      prisma.sponsorshipPackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
      await service.remove('pkg-1');
      expect(prisma.sponsorshipPackage.delete).toHaveBeenCalledWith({
        where: { id: 'pkg-1' },
      });
    });
  });
});
