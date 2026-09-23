import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FestivalStatus } from '@prisma/client';
import { FestivalsService } from './festivals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FestivalsService', () => {
  let prisma: {
    municipality: { findUnique: jest.Mock };
    festival: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: FestivalsService;

  beforeEach(() => {
    prisma = {
      municipality: { findUnique: jest.fn() },
      festival: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new FestivalsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown municipality', async () => {
      prisma.municipality.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          municipalityId: 'muni-1',
          name: 'Semana Santa de Timbío',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.festival.create).not.toHaveBeenCalled();
    });

    it('derives the slug from the name when not given', async () => {
      prisma.municipality.findUnique.mockResolvedValue({ id: 'muni-1' });
      prisma.festival.create.mockResolvedValue({});

      await service.create({
        municipalityId: 'muni-1',
        name: 'Semana Santa de Timbío',
      });

      expect(prisma.festival.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'semana-santa-de-timbio' }),
        }),
      );
    });

    it('uses an explicit slug when given', async () => {
      prisma.municipality.findUnique.mockResolvedValue({ id: 'muni-1' });
      prisma.festival.create.mockResolvedValue({});

      await service.create({
        municipalityId: 'muni-1',
        name: 'Semana Santa de Timbío',
        slug: 'custom-slug',
      });

      expect(prisma.festival.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'custom-slug' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws for a missing or soft-deleted festival', async () => {
      prisma.festival.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);

      prisma.festival.findUnique.mockResolvedValue({
        id: 'x',
        deletedAt: new Date(),
      });
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('does not touch the slug unless explicitly provided', async () => {
      prisma.festival.findUnique.mockResolvedValue({
        id: 'f1',
        deletedAt: null,
      });
      prisma.festival.update.mockResolvedValue({});

      await service.update('f1', { name: 'Nuevo nombre' });

      expect(prisma.festival.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: undefined }),
        }),
      );
    });

    it('validates the new municipality when changing it', async () => {
      prisma.festival.findUnique.mockResolvedValue({
        id: 'f1',
        deletedAt: null,
      });
      prisma.municipality.findUnique.mockResolvedValue(null);

      await expect(
        service.update('f1', { municipalityId: 'bad-muni' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.festival.update).not.toHaveBeenCalled();
    });

    it('allows updating the status', async () => {
      prisma.festival.findUnique.mockResolvedValue({
        id: 'f1',
        deletedAt: null,
      });
      prisma.festival.update.mockResolvedValue({});

      await service.update('f1', { status: FestivalStatus.ACTIVE });

      expect(prisma.festival.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: FestivalStatus.ACTIVE }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing festival', async () => {
      prisma.festival.findUnique.mockResolvedValue({
        id: 'f1',
        deletedAt: null,
      });
      prisma.festival.update.mockResolvedValue({});

      await service.remove('f1');

      expect(prisma.festival.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('throws when the festival does not exist', async () => {
      prisma.festival.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
