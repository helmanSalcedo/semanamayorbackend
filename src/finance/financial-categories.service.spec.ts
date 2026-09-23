import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinancialCategoryType } from '@prisma/client';
import { FinancialCategoriesService } from './financial-categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinancialCategoriesService', () => {
  let prisma: {
    financialCategory: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: FinancialCategoriesService;

  beforeEach(() => {
    prisma = {
      financialCategory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new FinancialCategoriesService(
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    it('rejects an unknown parentId', async () => {
      prisma.financialCategory.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          name: 'Sub',
          type: FinancialCategoryType.EXPENSE,
          parentId: 'missing',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.financialCategory.create).not.toHaveBeenCalled();
    });

    it('creates the category when the parent exists', async () => {
      prisma.financialCategory.findUnique.mockResolvedValue({ id: 'parent-1' });
      prisma.financialCategory.create.mockResolvedValue({ id: 'c1' });
      await service.create({
        name: 'Sub',
        type: FinancialCategoryType.EXPENSE,
        parentId: 'parent-1',
      });
      expect(prisma.financialCategory.create).toHaveBeenCalledWith({
        data: {
          name: 'Sub',
          type: FinancialCategoryType.EXPENSE,
          parentId: 'parent-1',
        },
      });
    });
  });

  describe('findOne', () => {
    it('404s for a missing category', async () => {
      prisma.financialCategory.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });
});
