import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventOrganizationsService } from './event-organizations.service';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventOrganizationsService', () => {
  let prisma: {
    organization: { findUnique: jest.Mock };
    eventOrganization: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let eventsService: { findOne: jest.Mock };
  let service: EventOrganizationsService;

  beforeEach(() => {
    prisma = {
      organization: { findUnique: jest.fn() },
      eventOrganization: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    eventsService = { findOne: jest.fn().mockResolvedValue({ id: 'event-1' }) };
    service = new EventOrganizationsService(
      prisma as unknown as PrismaService,
      eventsService as unknown as EventsService,
    );
  });

  describe('add', () => {
    it('rejects an unknown organizationId', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(
        service.add('festival-1', 'edition-1', 'event-1', {
          organizationId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.eventOrganization.create).not.toHaveBeenCalled();
    });

    it('links the organization when it exists', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.eventOrganization.create.mockResolvedValue({ id: 'eo-1' });

      await service.add('festival-1', 'edition-1', 'event-1', {
        organizationId: 'org-1',
        role: 'Patrocinador',
      });

      expect(prisma.eventOrganization.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event-1',
          organizationId: 'org-1',
          role: 'Patrocinador',
          notes: undefined,
        },
      });
    });
  });

  describe('remove', () => {
    it('404s when the item belongs to a different event', async () => {
      prisma.eventOrganization.findUnique.mockResolvedValue({
        id: 'eo-1',
        eventId: 'other',
      });
      await expect(
        service.remove('festival-1', 'edition-1', 'event-1', 'eo-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
