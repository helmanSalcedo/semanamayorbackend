import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BusinessStatus } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BusinessesService', () => {
  let prisma: {
    business: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    businessCategory: { findUnique: jest.Mock };
    organization: { findUnique: jest.Mock };
    mediaAsset: { findUnique: jest.Mock };
  };
  let service: BusinessesService;

  beforeEach(() => {
    prisma = {
      business: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      businessCategory: { findUnique: jest.fn() },
      organization: { findUnique: jest.fn() },
      mediaAsset: { findUnique: jest.fn() },
    };
    service = new BusinessesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown categoryId', async () => {
      prisma.businessCategory.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ categoryId: 'missing', name: 'Panadería' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.business.create).not.toHaveBeenCalled();
    });

    it('autogenerates the slug from the name', async () => {
      prisma.businessCategory.findUnique.mockResolvedValue({ id: 'cat-1' });
      prisma.business.create.mockResolvedValue({ id: 'biz-1' });

      await service.create({ categoryId: 'cat-1', name: 'Panadería Central' });

      expect(prisma.business.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'panaderia-central' }),
        }),
      );
    });
  });

  describe('findAllPublic', () => {
    it('only returns ACTIVE businesses', async () => {
      prisma.business.findMany.mockResolvedValue([]);
      prisma.business.count.mockResolvedValue(0);

      await service.findAllPublic({ page: 1, limit: 20, skip: 0 } as never);

      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: BusinessStatus.ACTIVE }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing business', async () => {
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setStatus', () => {
    it('updates the status', async () => {
      prisma.business.findUnique.mockResolvedValue({
        id: 'biz-1',
        deletedAt: null,
      });
      await service.setStatus('biz-1', BusinessStatus.ACTIVE);
      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: 'biz-1' },
        data: { status: BusinessStatus.ACTIVE },
      });
    });
  });
});
