import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RightsSubjectType } from '@prisma/client';
import { ContentRightsService } from './content-rights.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContentRightsService', () => {
  let prisma: {
    mediaAsset: { findUnique: jest.Mock };
    processionalStep: { findUnique: jest.Mock };
    contentRights: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: ContentRightsService;

  beforeEach(() => {
    prisma = {
      mediaAsset: { findUnique: jest.fn() },
      processionalStep: { findUnique: jest.fn() },
      contentRights: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ContentRightsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects a subject that does not exist', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          subjectType: RightsSubjectType.MEDIA_ASSET,
          subjectId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.contentRights.create).not.toHaveBeenCalled();
    });

    it('creates the rights record when the subject exists', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({ id: 'step-1' });
      prisma.contentRights.create.mockResolvedValue({ id: 'cr-1' });

      await service.create({
        subjectType: RightsSubjectType.PROCESSIONAL_STEP,
        subjectId: 'step-1',
        owner: 'Parroquia San Sebastián',
      });

      expect(prisma.contentRights.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subjectType: RightsSubjectType.PROCESSIONAL_STEP,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('404s when the record does not exist', async () => {
      prisma.contentRights.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
