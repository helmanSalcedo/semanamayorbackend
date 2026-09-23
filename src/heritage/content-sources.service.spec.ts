import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SourceableType } from '@prisma/client';
import { ContentSourcesService } from './content-sources.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContentSourcesService', () => {
  let prisma: {
    source: { findUnique: jest.Mock };
    contentSource: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    person: { findUnique: jest.Mock };
    processionalStep: { findUnique: jest.Mock };
  };
  let service: ContentSourcesService;

  beforeEach(() => {
    prisma = {
      source: { findUnique: jest.fn() },
      contentSource: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      person: { findUnique: jest.fn() },
      processionalStep: { findUnique: jest.fn() },
    };
    service = new ContentSourcesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown source', async () => {
      prisma.source.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          sourceId: 'missing',
          sourceableType: SourceableType.PERSON,
          sourceableId: 'person-1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.contentSource.create).not.toHaveBeenCalled();
    });

    it('rejects a sourceable that does not exist', async () => {
      prisma.source.findUnique.mockResolvedValue({
        id: 'src-1',
        deletedAt: null,
      });
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          sourceId: 'src-1',
          sourceableType: SourceableType.PERSON,
          sourceableId: 'missing-person',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.contentSource.create).not.toHaveBeenCalled();
    });

    it('creates the citation when both sides exist', async () => {
      prisma.source.findUnique.mockResolvedValue({
        id: 'src-1',
        deletedAt: null,
      });
      prisma.processionalStep.findUnique.mockResolvedValue({ id: 'step-1' });
      prisma.contentSource.create.mockResolvedValue({ id: 'cs-1' });

      await service.create({
        sourceId: 'src-1',
        sourceableType: SourceableType.PROCESSIONAL_STEP,
        sourceableId: 'step-1',
        citationNote: 'p. 12',
      });

      expect(prisma.contentSource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceId: 'src-1',
          sourceableType: SourceableType.PROCESSIONAL_STEP,
          sourceableId: 'step-1',
          citationNote: 'p. 12',
        }),
      });
    });
  });

  describe('remove', () => {
    it('404s when the citation does not exist', async () => {
      prisma.contentSource.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
