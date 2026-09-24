import { NotFoundException } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FamiliesService', () => {
  let prisma: {
    family: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: FamiliesService;

  beforeEach(() => {
    prisma = {
      family: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new FamiliesService(prisma as unknown as PrismaService);
  });

  describe('findOne', () => {
    it('404s for a missing family', async () => {
      prisma.family.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });

    it('404s for a soft-deleted family', async () => {
      prisma.family.findUnique.mockResolvedValue({
        id: 'fam-1',
        deletedAt: new Date(),
      });
      await expect(service.findOne('fam-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the family', async () => {
      prisma.family.findUnique.mockResolvedValue({
        id: 'fam-1',
        deletedAt: null,
      });
      await service.remove('fam-1');
      expect(prisma.family.update).toHaveBeenCalledWith({
        where: { id: 'fam-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
