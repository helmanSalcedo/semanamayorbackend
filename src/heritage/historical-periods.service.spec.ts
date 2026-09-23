import { NotFoundException } from '@nestjs/common';
import { HistoricalPeriodsService } from './historical-periods.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HistoricalPeriodsService', () => {
  let prisma: {
    historicalPeriod: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: HistoricalPeriodsService;

  beforeEach(() => {
    prisma = {
      historicalPeriod: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new HistoricalPeriodsService(prisma as unknown as PrismaService);
  });

  it('derives the slug from the name', async () => {
    prisma.historicalPeriod.create.mockResolvedValue({});
    await service.create({ name: 'Colonia' });
    expect(prisma.historicalPeriod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'colonia' }),
      }),
    );
  });

  describe('findOne', () => {
    it('404s for a missing period', async () => {
      prisma.historicalPeriod.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hard-deletes the period', async () => {
      prisma.historicalPeriod.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.historicalPeriod.delete.mockResolvedValue({});
      await service.remove('p1');
      expect(prisma.historicalPeriod.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });
  });
});
