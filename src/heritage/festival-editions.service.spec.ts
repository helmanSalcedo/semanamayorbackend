import { NotFoundException } from '@nestjs/common';
import { FestivalEditionsService } from './festival-editions.service';
import { FestivalsService } from './festivals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FestivalEditionsService', () => {
  let prisma: {
    festivalEdition: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let festivalsService: { findOne: jest.Mock };
  let service: FestivalEditionsService;

  beforeEach(() => {
    prisma = {
      festivalEdition: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    festivalsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'festival-1' }),
    };

    service = new FestivalEditionsService(
      prisma as unknown as PrismaService,
      festivalsService as unknown as FestivalsService,
    );
  });

  describe('create', () => {
    it('404s when the parent festival does not exist', async () => {
      festivalsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create('missing-festival', {
          year: 2027,
          name: 'Edición 2027',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.festivalEdition.create).not.toHaveBeenCalled();
    });

    it('creates the edition under the given festival', async () => {
      prisma.festivalEdition.create.mockResolvedValue({ id: 'edition-1' });

      await service.create('festival-1', {
        year: 2027,
        name: 'Edición 2027',
        startDate: '2027-03-28',
      });

      expect(prisma.festivalEdition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          festivalId: 'festival-1',
          year: 2027,
          startDate: new Date('2027-03-28'),
        }),
      });
    });
  });

  describe('findOne', () => {
    it('404s when the edition belongs to a different festival', async () => {
      prisma.festivalEdition.findUnique.mockResolvedValue({
        id: 'edition-1',
        festivalId: 'other-festival',
      });
      await expect(service.findOne('festival-1', 'edition-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the edition when it belongs to the given festival', async () => {
      prisma.festivalEdition.findUnique.mockResolvedValue({
        id: 'edition-1',
        festivalId: 'festival-1',
      });
      const result = await service.findOne('festival-1', 'edition-1');
      expect(result.id).toBe('edition-1');
    });
  });

  describe('remove', () => {
    it('hard-deletes the edition after verifying ownership', async () => {
      prisma.festivalEdition.findUnique.mockResolvedValue({
        id: 'edition-1',
        festivalId: 'festival-1',
      });
      prisma.festivalEdition.delete.mockResolvedValue({});

      await service.remove('festival-1', 'edition-1');

      expect(prisma.festivalEdition.delete).toHaveBeenCalledWith({
        where: { id: 'edition-1' },
      });
    });
  });
});
