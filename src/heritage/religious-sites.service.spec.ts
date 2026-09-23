import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReligiousSiteType } from '@prisma/client';
import { ReligiousSitesService } from './religious-sites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReligiousSitesService', () => {
  let prisma: {
    municipality: { findUnique: jest.Mock };
    religiousSite: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: ReligiousSitesService;

  beforeEach(() => {
    prisma = {
      municipality: { findUnique: jest.fn() },
      religiousSite: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ReligiousSitesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown municipality', async () => {
      prisma.municipality.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          municipalityId: 'muni-1',
          type: ReligiousSiteType.IGLESIA,
          name: 'Iglesia San Sebastián',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.religiousSite.create).not.toHaveBeenCalled();
    });

    it('derives the slug from the name when omitted', async () => {
      prisma.municipality.findUnique.mockResolvedValue({ id: 'muni-1' });
      prisma.religiousSite.create.mockResolvedValue({});

      await service.create({
        municipalityId: 'muni-1',
        type: ReligiousSiteType.IGLESIA,
        name: 'Iglesia San Sebastián',
      });

      expect(prisma.religiousSite.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'iglesia-san-sebastian' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws for a missing or soft-deleted site', async () => {
      prisma.religiousSite.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('validates the new municipality when changing it', async () => {
      prisma.religiousSite.findUnique.mockResolvedValue({
        id: 's1',
        deletedAt: null,
      });
      prisma.municipality.findUnique.mockResolvedValue(null);

      await expect(
        service.update('s1', { municipalityId: 'bad' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.religiousSite.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-deletes the site', async () => {
      prisma.religiousSite.findUnique.mockResolvedValue({
        id: 's1',
        deletedAt: null,
      });
      prisma.religiousSite.update.mockResolvedValue({});

      await service.remove('s1');

      expect(prisma.religiousSite.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
