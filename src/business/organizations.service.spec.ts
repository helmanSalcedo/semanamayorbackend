import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrganizationsService', () => {
  let prisma: {
    organization: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    organizationType: { findUnique: jest.Mock };
    mediaAsset: { findUnique: jest.Mock };
  };
  let service: OrganizationsService;

  beforeEach(() => {
    prisma = {
      organization: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organizationType: { findUnique: jest.fn() },
      mediaAsset: { findUnique: jest.fn() },
    };
    service = new OrganizationsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown typeId', async () => {
      prisma.organizationType.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ typeId: 'missing', name: 'Acme' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.organization.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown logoMediaAssetId', async () => {
      prisma.organizationType.findUnique.mockResolvedValue({ id: 'type-1' });
      prisma.mediaAsset.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          typeId: 'type-1',
          name: 'Acme',
          logoMediaAssetId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the organization when type and media exist', async () => {
      prisma.organizationType.findUnique.mockResolvedValue({ id: 'type-1' });
      prisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'media-1',
        deletedAt: null,
      });
      prisma.organization.create.mockResolvedValue({ id: 'org-1' });

      await service.create({
        typeId: 'type-1',
        name: 'Acme',
        logoMediaAssetId: 'media-1',
      });

      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ typeId: 'type-1', name: 'Acme' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing organization', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });

    it('404s for a soft-deleted organization', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        deletedAt: new Date(),
      });
      await expect(service.findOne('org-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the organization', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        deletedAt: null,
      });
      await service.remove('org-1');
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
