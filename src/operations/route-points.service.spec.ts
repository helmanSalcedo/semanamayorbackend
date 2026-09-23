import { NotFoundException } from '@nestjs/common';
import { RoutePointsService } from './route-points.service';
import { ProcessionRoutesService } from './procession-routes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RoutePointsService', () => {
  let prisma: {
    processionRoutePoint: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let routesService: { findOne: jest.Mock };
  let service: RoutePointsService;

  beforeEach(() => {
    prisma = {
      processionRoutePoint: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    routesService = { findOne: jest.fn().mockResolvedValue({ id: 'route-1' }) };
    service = new RoutePointsService(
      prisma as unknown as PrismaService,
      routesService as unknown as ProcessionRoutesService,
    );
  });

  it('adds a point to the route', async () => {
    prisma.processionRoutePoint.create.mockResolvedValue({ id: 'point-1' });
    await service.add('festival-1', 'edition-1', 'procession-1', 'route-1', {
      order: 0,
      latitude: 2.35,
      longitude: -76.68,
    });
    expect(prisma.processionRoutePoint.create).toHaveBeenCalledWith({
      data: {
        routeId: 'route-1',
        order: 0,
        latitude: 2.35,
        longitude: -76.68,
        streetName: undefined,
        description: undefined,
      },
    });
  });

  describe('remove', () => {
    it('404s when the point belongs to a different route', async () => {
      prisma.processionRoutePoint.findUnique.mockResolvedValue({
        id: 'p1',
        routeId: 'other',
      });
      await expect(
        service.remove(
          'festival-1',
          'edition-1',
          'procession-1',
          'route-1',
          'p1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
