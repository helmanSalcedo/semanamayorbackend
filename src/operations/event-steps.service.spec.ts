import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventStepsService } from './event-steps.service';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventStepsService', () => {
  let prisma: {
    processionalStep: { findUnique: jest.Mock };
    eventStep: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let eventsService: { findOne: jest.Mock };
  let service: EventStepsService;

  beforeEach(() => {
    prisma = {
      processionalStep: { findUnique: jest.fn() },
      eventStep: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    eventsService = { findOne: jest.fn().mockResolvedValue({ id: 'event-1' }) };
    service = new EventStepsService(
      prisma as unknown as PrismaService,
      eventsService as unknown as EventsService,
    );
  });

  describe('add', () => {
    it('rejects a processionalStepId from another festival', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({
        id: 'step-1',
        festivalId: 'other',
        deletedAt: null,
      });
      await expect(
        service.add('festival-1', 'edition-1', 'event-1', {
          processionalStepId: 'step-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('404s when the item belongs to a different event', async () => {
      prisma.eventStep.findUnique.mockResolvedValue({
        id: 'es-1',
        eventId: 'other',
      });
      await expect(
        service.remove('festival-1', 'edition-1', 'event-1', 'es-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
