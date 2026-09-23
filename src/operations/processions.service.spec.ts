import { NotFoundException } from '@nestjs/common';
import { ProcessionsService } from './processions.service';
import { FestivalEditionsService } from '../heritage/festival-editions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProcessionsService', () => {
  let prisma: {
    procession: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let festivalEditionsService: { findOne: jest.Mock };
  let service: ProcessionsService;

  beforeEach(() => {
    prisma = {
      procession: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    festivalEditionsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'edition-1' }),
    };
    service = new ProcessionsService(
      prisma as unknown as PrismaService,
      festivalEditionsService as unknown as FestivalEditionsService,
    );
  });

  describe('create', () => {
    it('404s when the edition does not exist', async () => {
      festivalEditionsService.findOne.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(
        service.create('festival-1', 'missing', {
          name: 'Procesión del Silencio',
          date: '2027-03-30',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.procession.create).not.toHaveBeenCalled();
    });

    it('converts HH:mm times to Date objects on a fixed epoch date', async () => {
      prisma.procession.create.mockResolvedValue({ id: 'proc-1' });
      await service.create('festival-1', 'edition-1', {
        name: 'Procesión del Silencio',
        date: '2027-03-30',
        startTime: '19:00',
        estimatedEndTime: '22:30',
      });

      expect(prisma.procession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startTime: new Date('1970-01-01T19:00:00.000Z'),
            estimatedEndTime: new Date('1970-01-01T22:30:00.000Z'),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s when the procession belongs to a different edition', async () => {
      prisma.procession.findUnique.mockResolvedValue({
        id: 'p1',
        festivalEditionId: 'other',
        deletedAt: null,
      });
      await expect(
        service.findOne('festival-1', 'edition-1', 'p1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the procession', async () => {
      prisma.procession.findUnique.mockResolvedValue({
        id: 'p1',
        festivalEditionId: 'edition-1',
        deletedAt: null,
      });
      prisma.procession.update.mockResolvedValue({});
      await service.remove('festival-1', 'edition-1', 'p1');
      expect(prisma.procession.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
