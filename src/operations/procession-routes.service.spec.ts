import { NotFoundException } from '@nestjs/common';
import { ProcessionRoutesService } from './procession-routes.service';
import { ProcessionsService } from './processions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProcessionRoutesService', () => {
  let prisma: {
    processionRoute: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let processionsService: { findOne: jest.Mock };
  let service: ProcessionRoutesService;

  beforeEach(() => {
    prisma = {
      processionRoute: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    processionsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'procession-1' }),
    };
    service = new ProcessionRoutesService(
      prisma as unknown as PrismaService,
      processionsService as unknown as ProcessionsService,
    );
  });

  it('creates a route under the given procession', async () => {
    prisma.processionRoute.create.mockResolvedValue({ id: 'route-1' });
    await service.create('festival-1', 'edition-1', 'procession-1', {
      name: 'Recorrido',
    });
    expect(prisma.processionRoute.create).toHaveBeenCalledWith({
      data: {
        processionId: 'procession-1',
        name: 'Recorrido',
        description: undefined,
      },
    });
  });

  describe('findOne', () => {
    it('404s when the route belongs to a different procession', async () => {
      prisma.processionRoute.findUnique.mockResolvedValue({
        id: 'route-1',
        processionId: 'other',
      });
      await expect(
        service.findOne('festival-1', 'edition-1', 'procession-1', 'route-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the route (cascades points at the DB level)', async () => {
      prisma.processionRoute.findUnique.mockResolvedValue({
        id: 'route-1',
        processionId: 'procession-1',
      });
      prisma.processionRoute.delete.mockResolvedValue({});

      await service.remove(
        'festival-1',
        'edition-1',
        'procession-1',
        'route-1',
      );

      expect(prisma.processionRoute.delete).toHaveBeenCalledWith({
        where: { id: 'route-1' },
      });
    });
  });
});
