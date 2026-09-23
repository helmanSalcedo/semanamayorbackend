import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GalleriesService', () => {
  let prisma: {
    festivalEdition: { findUnique: jest.Mock };
    mediaAsset: { findUnique: jest.Mock };
    gallery: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: GalleriesService;

  beforeEach(() => {
    prisma = {
      festivalEdition: { findUnique: jest.fn() },
      mediaAsset: { findUnique: jest.fn() },
      gallery: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new GalleriesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown festivalEditionId', async () => {
      prisma.festivalEdition.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Fotos 2027', festivalEditionId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.gallery.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown coverMediaAssetId', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Fotos 2027', coverMediaAssetId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('derives the slug from the name', async () => {
      prisma.gallery.create.mockResolvedValue({});
      await service.create({ name: 'Fotos Semana Santa' });
      expect(prisma.gallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'fotos-semana-santa' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted gallery', async () => {
      prisma.gallery.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the gallery', async () => {
      prisma.gallery.findUnique.mockResolvedValue({
        id: 'g1',
        deletedAt: null,
      });
      prisma.gallery.update.mockResolvedValue({});
      await service.remove('g1');
      expect(prisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 'g1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
