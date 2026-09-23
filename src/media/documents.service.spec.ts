import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentsService', () => {
  let tx: {
    documentVersion: { findFirst: jest.Mock; create: jest.Mock };
    document: { update: jest.Mock };
  };
  let prisma: {
    mediaAsset: { findUnique: jest.Mock };
    source: { findUnique: jest.Mock };
    document: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
    documentVersion: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: DocumentsService;

  beforeEach(() => {
    tx = {
      documentVersion: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
      document: { update: jest.fn().mockResolvedValue({ id: 'doc-1' }) },
    };
    prisma = {
      mediaAsset: { findUnique: jest.fn() },
      source: { findUnique: jest.fn() },
      document: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      documentVersion: { findMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    service = new DocumentsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown mediaAssetId', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          title: 'Acta',
          type: DocumentType.ACTA,
          mediaAssetId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.document.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown sourceId', async () => {
      prisma.source.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          title: 'Acta',
          type: DocumentType.ACTA,
          sourceId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted document', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('snapshots the current state into DocumentVersion before applying the update', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        title: 'Acta original',
        type: DocumentType.ACTA,
        deletedAt: null,
      });
      tx.documentVersion.findFirst.mockResolvedValue({ versionNumber: 2 });

      await service.update('doc-1', { title: 'Acta corregida' }, 'user-1');

      expect(tx.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentId: 'doc-1',
            versionNumber: 3,
            changedByUserId: 'user-1',
          }),
        }),
      );
      expect(tx.document.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'doc-1' } }),
      );
    });

    it('starts version numbering at 1 when there is no prior version', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 'doc-1',
        title: 'Acta original',
        deletedAt: null,
      });
      tx.documentVersion.findFirst.mockResolvedValue(null);

      await service.update('doc-1', { title: 'v2' }, 'user-1');

      expect(tx.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ versionNumber: 1 }),
        }),
      );
    });
  });
});
