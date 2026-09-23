import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '@prisma/client';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function buildFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'foto.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-image-bytes'),
    size: 1024,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

describe('MediaService', () => {
  let prisma: {
    mediaAsset: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    festivalEdition: { findUnique: jest.Mock };
  };
  let storageService: { upload: jest.Mock; delete: jest.Mock };
  let service: MediaService;

  beforeEach(() => {
    prisma = {
      mediaAsset: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      festivalEdition: { findUnique: jest.fn() },
    };
    storageService = {
      upload: jest.fn().mockResolvedValue({
        url: 'https://cdn/x.png',
        storageKey: 'media/x.png',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: () => ({ storage: { maxFileSizeMb: 50 } }),
    } as unknown as ConfigService;

    service = new MediaService(
      prisma as unknown as PrismaService,
      storageService as unknown as StorageService,
      configService,
    );
  });

  describe('upload', () => {
    it('rejects unsupported mime types', async () => {
      await expect(
        service.upload(buildFile({ mimetype: 'application/zip' }), 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('rejects files larger than the configured limit', async () => {
      await expect(
        service.upload(buildFile({ size: 51 * 1024 * 1024 }), 'user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(storageService.upload).not.toHaveBeenCalled();
    });

    it('uploads a valid image and creates the MediaAsset row', async () => {
      prisma.mediaAsset.create.mockResolvedValue({
        id: 'asset-1',
        type: MediaType.IMAGE,
        url: 'https://cdn/x.png',
        filename: 'foto.png',
        mimeType: 'image/png',
        sizeBytes: BigInt(1024),
        checksum: 'deadbeef',
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.upload(buildFile(), 'user-1');

      expect(storageService.upload).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining('general/image/'),
        'image/png',
      );
      expect(prisma.mediaAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: MediaType.IMAGE,
            storageProvider: 'firebase',
            uploadedByUserId: 'user-1',
          }),
        }),
      );
      expect(result.id).toBe('asset-1');
      expect(result.sizeBytes).toBe(1024); // BigInt converted to number
    });

    it('accepts a PDF as a document', async () => {
      prisma.mediaAsset.create.mockResolvedValue({
        id: 'asset-2',
        type: MediaType.DOCUMENT,
        url: 'https://cdn/x.pdf',
        filename: 'acta.pdf',
        mimeType: 'application/pdf',
        sizeBytes: BigInt(2048),
        checksum: 'cafebabe',
        createdAt: new Date(),
      });

      await service.upload(
        buildFile({ mimetype: 'application/pdf', originalname: 'acta.pdf' }),
        'user-1',
      );

      expect(prisma.mediaAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: MediaType.DOCUMENT }),
        }),
      );
    });

    it('files into festivals/{slug}/{year}/... when a festivalEditionId is given', async () => {
      prisma.festivalEdition.findUnique.mockResolvedValue({
        id: 'edition-1',
        year: 2026,
        festival: { slug: 'semana-santa-timbio' },
      });
      prisma.mediaAsset.create.mockResolvedValue({
        id: 'asset-3',
        type: MediaType.IMAGE,
        url: 'https://cdn/x.png',
        filename: 'foto.png',
        mimeType: 'image/png',
        sizeBytes: BigInt(1024),
        checksum: 'x',
        createdAt: new Date(),
      });

      await service.upload(buildFile(), 'user-1', 'edition-1');

      expect(prisma.festivalEdition.findUnique).toHaveBeenCalledWith({
        where: { id: 'edition-1' },
        include: { festival: { select: { slug: true } } },
      });
      expect(storageService.upload).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining('festivals/semana-santa-timbio/2026/image/'),
        'image/png',
      );
    });

    it('rejects a festivalEditionId that does not exist', async () => {
      prisma.festivalEdition.findUnique.mockResolvedValue(null);

      await expect(
        service.upload(buildFile(), 'user-1', 'missing-edition'),
      ).rejects.toThrow(BadRequestException);
      expect(storageService.upload).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws when the asset does not exist or is soft-deleted', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );

      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'x',
        deletedAt: new Date(),
      });
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the row and hard-deletes the file from storage', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'asset-1',
        storageKey: 'media/x.png',
        deletedAt: null,
      });
      prisma.mediaAsset.update.mockResolvedValue({});

      await service.remove('asset-1');

      expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(storageService.delete).toHaveBeenCalledWith('media/x.png');
    });

    it('throws when trying to remove a missing asset', async () => {
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(storageService.delete).not.toHaveBeenCalled();
    });
  });
});
