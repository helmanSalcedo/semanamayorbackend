import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachableType, MediaAttachmentRole } from '@prisma/client';
import { ProcessionalStepsService } from './processional-steps.service';
import { FestivalsService } from './festivals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProcessionalStepsService', () => {
  let prisma: {
    processionalStep: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    mediaAsset: { findUnique: jest.Mock };
    mediaAttachment: { deleteMany: jest.Mock; create: jest.Mock };
  };
  let festivalsService: { findOne: jest.Mock };
  let service: ProcessionalStepsService;

  beforeEach(() => {
    prisma = {
      processionalStep: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      mediaAsset: { findUnique: jest.fn() },
      mediaAttachment: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    festivalsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'festival-1' }),
    };
    service = new ProcessionalStepsService(
      prisma as unknown as PrismaService,
      festivalsService as unknown as FestivalsService,
    );
  });

  describe('create', () => {
    it('404s when the festival does not exist', async () => {
      festivalsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create('missing', { name: 'El Nazareno' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.processionalStep.create).not.toHaveBeenCalled();
    });

    it('derives the slug from the name when omitted', async () => {
      prisma.processionalStep.create.mockResolvedValue({});
      await service.create('festival-1', { name: 'El Nazareno' });
      expect(prisma.processionalStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'el-nazareno' }),
        }),
      );
    });

    it('rejects a primaryMediaAssetId that does not exist', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create('festival-1', {
          name: 'El Nazareno',
          primaryMediaAssetId: 'bad-id',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.processionalStep.create).not.toHaveBeenCalled();
    });

    it('accepts an existing primaryMediaAssetId and syncs the PRIMARY MediaAttachment', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        deletedAt: null,
      });
      prisma.processionalStep.create.mockResolvedValue({ id: 'step-1' });
      await service.create('festival-1', {
        name: 'El Nazareno',
        primaryMediaAssetId: 'media-1',
      });
      expect(prisma.processionalStep.create).toHaveBeenCalled();

      // Clears any stale PRIMARY attachment before creating the fresh one —
      // this is the app-level mirror of the primaryMediaAssetId denormalization.
      expect(prisma.mediaAttachment.deleteMany).toHaveBeenCalledWith({
        where: {
          attachableType: AttachableType.PROCESSIONAL_STEP,
          attachableId: 'step-1',
          role: MediaAttachmentRole.PRIMARY,
        },
      });
      expect(prisma.mediaAttachment.create).toHaveBeenCalledWith({
        data: {
          mediaAssetId: 'media-1',
          attachableType: AttachableType.PROCESSIONAL_STEP,
          attachableId: 'step-1',
          role: MediaAttachmentRole.PRIMARY,
        },
      });
    });

    it('does not touch MediaAttachment when no primaryMediaAssetId is given', async () => {
      prisma.processionalStep.create.mockResolvedValue({ id: 'step-1' });
      await service.create('festival-1', { name: 'El Nazareno' });
      expect(prisma.mediaAttachment.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('404s when the step belongs to a different festival', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({
        id: 's1',
        festivalId: 'other',
        deletedAt: null,
      });
      await expect(service.findOne('festival-1', 's1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('404s when the step is soft-deleted', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({
        id: 's1',
        festivalId: 'festival-1',
        deletedAt: new Date(),
      });
      await expect(service.findOne('festival-1', 's1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes the step', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({
        id: 's1',
        festivalId: 'festival-1',
        deletedAt: null,
      });
      prisma.processionalStep.update.mockResolvedValue({});

      await service.remove('festival-1', 's1');

      expect(prisma.processionalStep.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
