import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ArticlesService', () => {
  let tx: {
    articleVersion: { findFirst: jest.Mock; create: jest.Mock };
    articleTag: { deleteMany: jest.Mock; createMany: jest.Mock };
    article: { update: jest.Mock };
  };
  let prisma: {
    festival: { findUnique: jest.Mock };
    articleCategory: { findUnique: jest.Mock };
    mediaAsset: { findUnique: jest.Mock };
    tag: { count: jest.Mock };
    article: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    articleVersion: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: ArticlesService;

  beforeEach(() => {
    tx = {
      articleVersion: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({}),
      },
      articleTag: {
        deleteMany: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
      },
      article: { update: jest.fn().mockResolvedValue({ id: 'article-1' }) },
    };
    prisma = {
      festival: { findUnique: jest.fn() },
      articleCategory: { findUnique: jest.fn() },
      mediaAsset: { findUnique: jest.fn() },
      tag: { count: jest.fn() },
      article: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      articleVersion: { findMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    service = new ArticlesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('rejects an unknown categoryId', async () => {
      prisma.articleCategory.findUnique.mockResolvedValue(null);
      await expect(
        service.create(
          { title: 'Nota', content: 'cuerpo', categoryId: 'missing' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.article.create).not.toHaveBeenCalled();
    });

    it('rejects a tagId that does not exist', async () => {
      prisma.tag.count.mockResolvedValue(1);
      await expect(
        service.create(
          { title: 'Nota', content: 'cuerpo', tagIds: ['t1', 't2'] },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('derives the slug from the title and creates the tag links', async () => {
      prisma.tag.count.mockResolvedValue(2);
      prisma.article.create.mockResolvedValue({ id: 'article-1' });

      await service.create(
        {
          title: 'Así viven la Semana Santa',
          content: 'cuerpo',
          tagIds: ['t1', 't2'],
        },
        'user-1',
      );

      expect(prisma.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'asi-viven-la-semana-santa',
            authorUserId: 'user-1',
            tags: { create: [{ tagId: 't1' }, { tagId: 't2' }] },
          }),
        }),
      );
    });
  });

  describe('findPublishedOne', () => {
    it('404s a draft article even by direct id (never public)', async () => {
      prisma.article.findUnique.mockResolvedValue({
        id: 'a1',
        status: ArticleStatus.DRAFT,
        deletedAt: null,
      });
      await expect(service.findPublishedOne('a1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a published article', async () => {
      prisma.article.findUnique.mockResolvedValue({
        id: 'a1',
        status: ArticleStatus.PUBLISHED,
        deletedAt: null,
      });
      const result = await service.findPublishedOne('a1');
      expect(result.id).toBe('a1');
    });
  });

  describe('update', () => {
    it('snapshots the previous title/content into ArticleVersion', async () => {
      prisma.article.findUnique.mockResolvedValue({
        id: 'a1',
        title: 'Título viejo',
        content: 'Contenido viejo',
        deletedAt: null,
      });
      tx.articleVersion.findFirst.mockResolvedValue({ versionNumber: 1 });

      await service.update('a1', { title: 'Título nuevo' }, 'editor-1');

      expect(tx.articleVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            articleId: 'a1',
            versionNumber: 2,
            title: 'Título viejo',
            content: 'Contenido viejo',
            editedByUserId: 'editor-1',
          }),
        }),
      );
    });

    it('replaces tag links when tagIds is provided', async () => {
      prisma.article.findUnique.mockResolvedValue({
        id: 'a1',
        title: 't',
        content: 'c',
        deletedAt: null,
      });
      prisma.tag.count.mockResolvedValue(1);
      tx.articleVersion.findFirst.mockResolvedValue(null);

      await service.update('a1', { tagIds: ['t9'] }, 'editor-1');

      expect(tx.articleTag.deleteMany).toHaveBeenCalledWith({
        where: { articleId: 'a1' },
      });
      expect(tx.articleTag.createMany).toHaveBeenCalledWith({
        data: [{ articleId: 'a1', tagId: 't9' }],
      });
    });
  });

  describe('publish/unpublish', () => {
    it('publish sets status PUBLISHED and stamps publishedAt', async () => {
      prisma.article.findUnique.mockResolvedValue({
        id: 'a1',
        deletedAt: null,
      });
      prisma.article.update.mockResolvedValue({});
      await service.publish('a1');
      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: ArticleStatus.PUBLISHED,
            publishedAt: expect.any(Date),
          },
        }),
      );
    });

    it('unpublish reverts status to DRAFT', async () => {
      prisma.article.findUnique.mockResolvedValue({
        id: 'a1',
        deletedAt: null,
      });
      prisma.article.update.mockResolvedValue({});
      await service.unpublish('a1');
      expect(prisma.article.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ArticleStatus.DRAFT } }),
      );
    });
  });
});
