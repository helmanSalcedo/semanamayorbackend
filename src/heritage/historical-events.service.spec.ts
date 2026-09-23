import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HistoricalEventsService } from './historical-events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HistoricalEventsService', () => {
  let prisma: {
    festival: { findUnique: jest.Mock };
    historicalPeriod: { findUnique: jest.Mock };
    historicalEvent: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: HistoricalEventsService;

  beforeEach(() => {
    prisma = {
      festival: { findUnique: jest.fn() },
      historicalPeriod: { findUnique: jest.fn() },
      historicalEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new HistoricalEventsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown festivalId', async () => {
      prisma.festival.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ title: 'Fundación', festivalId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.historicalEvent.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown periodId', async () => {
      prisma.historicalPeriod.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ title: 'Fundación', periodId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('derives the slug from the title', async () => {
      prisma.historicalEvent.create.mockResolvedValue({});
      await service.create({ title: 'Fundación de la cofradía' });
      expect(prisma.historicalEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'fundacion-de-la-cofradia' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted event', async () => {
      prisma.historicalEvent.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the event', async () => {
      prisma.historicalEvent.findUnique.mockResolvedValue({
        id: 'e1',
        deletedAt: null,
      });
      prisma.historicalEvent.update.mockResolvedValue({});
      await service.remove('e1');
      expect(prisma.historicalEvent.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
