import { NotFoundException } from '@nestjs/common';
import { ReligiousImagesService } from './religious-images.service';
import { ProcessionalStepsService } from './processional-steps.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReligiousImagesService', () => {
  let prisma: {
    religiousImage: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let stepsService: { findOne: jest.Mock };
  let service: ReligiousImagesService;

  beforeEach(() => {
    prisma = {
      religiousImage: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    stepsService = { findOne: jest.fn().mockResolvedValue({ id: 'step-1' }) };
    service = new ReligiousImagesService(
      prisma as unknown as PrismaService,
      stepsService as unknown as ProcessionalStepsService,
    );
  });

  describe('create', () => {
    it('404s when the step does not exist under that festival', async () => {
      stepsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create('festival-1', 'missing-step', {
          name: 'Cristo Yacente',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.religiousImage.create).not.toHaveBeenCalled();
    });

    it('creates the image under the given step', async () => {
      prisma.religiousImage.create.mockResolvedValue({ id: 'img-1' });
      await service.create('festival-1', 'step-1', { name: 'Cristo Yacente' });
      expect(prisma.religiousImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          processionalStepId: 'step-1',
          name: 'Cristo Yacente',
        }),
      });
    });
  });

  describe('findOne', () => {
    it('404s when the image belongs to a different step', async () => {
      prisma.religiousImage.findUnique.mockResolvedValue({
        id: 'img-1',
        processionalStepId: 'other-step',
        deletedAt: null,
      });
      await expect(
        service.findOne('festival-1', 'step-1', 'img-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the image', async () => {
      prisma.religiousImage.findUnique.mockResolvedValue({
        id: 'img-1',
        processionalStepId: 'step-1',
        deletedAt: null,
      });
      prisma.religiousImage.update.mockResolvedValue({});

      await service.remove('festival-1', 'step-1', 'img-1');

      expect(prisma.religiousImage.update).toHaveBeenCalledWith({
        where: { id: 'img-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
