import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GalleryItemsService } from './gallery-items.service';
import { GalleriesService } from './galleries.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GalleryItemsService', () => {
  let prisma: {
    mediaAsset: { findUnique: jest.Mock };
    galleryItem: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let galleriesService: { findOne: jest.Mock };
  let service: GalleryItemsService;

  beforeEach(() => {
    prisma = {
      mediaAsset: { findUnique: jest.fn() },
      galleryItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    galleriesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'gallery-1' }),
    };
    service = new GalleryItemsService(
      prisma as unknown as PrismaService,
      galleriesService as unknown as GalleriesService,
    );
  });

  describe('add', () => {
    it('404s when the gallery does not exist', async () => {
      galleriesService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.add('missing-gallery', { mediaAssetId: 'media-1' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.galleryItem.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown mediaAssetId', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.add('gallery-1', { mediaAssetId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('adds the item when both exist', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        deletedAt: null,
      });
      prisma.galleryItem.create.mockResolvedValue({ id: 'item-1' });

      await service.add('gallery-1', {
        mediaAssetId: 'media-1',
        order: 2,
        caption: 'Foto 1',
      });

      expect(prisma.galleryItem.create).toHaveBeenCalledWith({
        data: {
          galleryId: 'gallery-1',
          mediaAssetId: 'media-1',
          order: 2,
          caption: 'Foto 1',
        },
      });
    });
  });

  describe('remove', () => {
    it('404s when the item belongs to a different gallery', async () => {
      prisma.galleryItem.findUnique.mockResolvedValue({
        id: 'item-1',
        galleryId: 'other',
      });
      await expect(service.remove('gallery-1', 'item-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
