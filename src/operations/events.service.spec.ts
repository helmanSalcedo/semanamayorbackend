import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { EventsService } from './events.service';
import { FestivalEditionsService } from '../heritage/festival-editions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let prisma: {
    event: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    religiousSite: { findUnique: jest.Mock };
  };
  let festivalEditionsService: { findOne: jest.Mock };
  let service: EventsService;

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      religiousSite: { findUnique: jest.fn() },
    };
    festivalEditionsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'edition-1' }),
    };
    service = new EventsService(
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
        service.create('festival-1', 'missing-edition', {
          title: 'Misa',
          eventType: EventType.MASS,
          startDatetime: '2027-03-30T19:00:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.event.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown religiousSiteId', async () => {
      prisma.religiousSite.findUnique.mockResolvedValue(null);
      await expect(
        service.create('festival-1', 'edition-1', {
          title: 'Misa',
          eventType: EventType.MASS,
          startDatetime: '2027-03-30T19:00:00.000Z',
          religiousSiteId: 'missing-site',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.event.create).not.toHaveBeenCalled();
    });

    it('derives the slug from the title', async () => {
      prisma.event.create.mockResolvedValue({ id: 'event-1' });
      await service.create('festival-1', 'edition-1', {
        title: 'Misa de Domingo de Ramos',
        eventType: EventType.MASS,
        startDatetime: '2027-03-28T10:00:00.000Z',
      });
      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'misa-de-domingo-de-ramos' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s when the event belongs to a different edition', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'e1',
        festivalEditionId: 'other',
        deletedAt: null,
      });
      await expect(
        service.findOne('festival-1', 'edition-1', 'e1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the event', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'e1',
        festivalEditionId: 'edition-1',
        deletedAt: null,
      });
      prisma.event.update.mockResolvedValue({});
      await service.remove('festival-1', 'edition-1', 'e1');
      expect(prisma.event.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
