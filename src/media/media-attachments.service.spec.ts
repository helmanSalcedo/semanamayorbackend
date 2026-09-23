import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachableType, MediaAttachmentRole } from '@prisma/client';
import { MediaAttachmentsService } from './media-attachments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MediaAttachmentsService', () => {
  let prisma: {
    mediaAsset: { findUnique: jest.Mock };
    mediaAttachment: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    processionalStep: { findUnique: jest.Mock };
    festival: { findUnique: jest.Mock };
  };
  let service: MediaAttachmentsService;

  beforeEach(() => {
    prisma = {
      mediaAsset: { findUnique: jest.fn() },
      mediaAttachment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      processionalStep: { findUnique: jest.fn() },
      festival: { findUnique: jest.fn() },
    };
    service = new MediaAttachmentsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown mediaAssetId', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          mediaAssetId: 'missing',
          attachableType: AttachableType.PROCESSIONAL_STEP,
          attachableId: 'step-1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mediaAttachment.create).not.toHaveBeenCalled();
    });

    it('rejects a mediaAssetId that is soft-deleted', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        deletedAt: new Date(),
      });
      await expect(
        service.create({
          mediaAssetId: 'media-1',
          attachableType: AttachableType.FESTIVAL,
          attachableId: 'festival-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an attachableId that does not exist for that type', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        deletedAt: null,
      });
      prisma.processionalStep.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          mediaAssetId: 'media-1',
          attachableType: AttachableType.PROCESSIONAL_STEP,
          attachableId: 'missing-step',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.mediaAttachment.create).not.toHaveBeenCalled();
    });

    it('creates the attachment when both sides exist', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        deletedAt: null,
      });
      prisma.festival.findUnique.mockResolvedValue({ id: 'festival-1' });
      prisma.mediaAttachment.create.mockResolvedValue({ id: 'att-1' });

      await service.create({
        mediaAssetId: 'media-1',
        attachableType: AttachableType.FESTIVAL,
        attachableId: 'festival-1',
        role: MediaAttachmentRole.COVER,
      });

      expect(prisma.mediaAttachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mediaAssetId: 'media-1',
          attachableType: AttachableType.FESTIVAL,
          attachableId: 'festival-1',
          role: MediaAttachmentRole.COVER,
        }),
      });
    });
  });

  describe('remove', () => {
    it('404s when the attachment does not exist', async () => {
      prisma.mediaAttachment.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.mediaAttachment.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing attachment', async () => {
      prisma.mediaAttachment.findUnique.mockResolvedValue({ id: 'att-1' });
      prisma.mediaAttachment.delete.mockResolvedValue({});

      await service.remove('att-1');

      expect(prisma.mediaAttachment.delete).toHaveBeenCalledWith({
        where: { id: 'att-1' },
      });
    });
  });
});
