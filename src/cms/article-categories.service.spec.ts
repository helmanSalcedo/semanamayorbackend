import { NotFoundException } from '@nestjs/common';
import { ArticleCategoriesService } from './article-categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ArticleCategoriesService', () => {
  let prisma: {
    articleCategory: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: ArticleCategoriesService;

  beforeEach(() => {
    prisma = {
      articleCategory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ArticleCategoriesService(prisma as unknown as PrismaService);
  });

  it('derives the slug from the name', async () => {
    prisma.articleCategory.create.mockResolvedValue({});
    await service.create({ name: 'Historia' });
    expect(prisma.articleCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'historia' }),
      }),
    );
  });

  describe('findOne', () => {
    it('404s for a missing category', async () => {
      prisma.articleCategory.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });
});
