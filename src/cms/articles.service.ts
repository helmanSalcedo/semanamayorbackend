import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Article, ArticleStatus, AuditAction, Prisma } from '@prisma/client';
import { recordAuditLog } from '../common/audit-log.util';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { slugify } from '../heritage/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesDto } from './dto/find-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

const ARTICLE_INCLUDE = { tags: { include: { tag: true } } } as const;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateArticleDto,
    authorUserId: string | undefined,
  ): Promise<Article> {
    await this.assertFestivalExists(dto.festivalId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertMediaAssetExists(dto.coverMediaAssetId);
    await this.assertMediaAssetExists(dto.socialImageMediaAssetId);
    await this.assertTagsExist(dto.tagIds);

    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug: dto.slug?.trim() || slugify(dto.title),
        content: dto.content,
        excerpt: dto.excerpt,
        festivalId: dto.festivalId,
        categoryId: dto.categoryId,
        authorUserId,
        coverMediaAssetId: dto.coverMediaAssetId,
        socialImageMediaAssetId: dto.socialImageMediaAssetId,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        canonicalUrl: dto.canonicalUrl,
        tags: dto.tagIds
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: ARTICLE_INCLUDE,
    });
  }

  /** Public site: only ever sees published content. */
  async findPublished(
    query: FindArticlesDto,
  ): Promise<PaginatedResult<Article>> {
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      status: ArticleStatus.PUBLISHED,
      categoryId: query.categoryId,
      festivalId: query.festivalId,
    };
    return this.paginateArticles(where, query);
  }

  /** Staff view: every status, for the editorial workflow. */
  async findAllForManagement(
    query: FindArticlesDto,
  ): Promise<PaginatedResult<Article>> {
    const where: Prisma.ArticleWhereInput = {
      deletedAt: null,
      status: query.status,
      categoryId: query.categoryId,
      festivalId: query.festivalId,
    };
    return this.paginateArticles(where, query);
  }

  async findPublishedOne(id: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: ARTICLE_INCLUDE,
    });
    if (
      !article ||
      article.deletedAt ||
      article.status !== ArticleStatus.PUBLISHED
    ) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return article;
  }

  async findOneForManagement(id: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: ARTICLE_INCLUDE,
    });
    if (!article || article.deletedAt) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return article;
  }

  async update(
    id: string,
    dto: UpdateArticleDto,
    editedByUserId: string | undefined,
  ): Promise<Article> {
    const current = await this.findOneForManagement(id);
    await this.assertFestivalExists(dto.festivalId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertMediaAssetExists(dto.coverMediaAssetId);
    await this.assertMediaAssetExists(dto.socialImageMediaAssetId);
    await this.assertTagsExist(dto.tagIds);

    return this.prisma.$transaction(async (tx) => {
      const lastVersion = await tx.articleVersion.findFirst({
        where: { articleId: id },
        orderBy: { versionNumber: 'desc' },
      });
      await tx.articleVersion.create({
        data: {
          articleId: id,
          versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
          editedByUserId,
          title: current.title,
          content: current.content,
          changeSummary: dto.changeSummary,
        },
      });

      if (dto.tagIds) {
        await tx.articleTag.deleteMany({ where: { articleId: id } });
        await tx.articleTag.createMany({
          data: dto.tagIds.map((tagId) => ({ articleId: id, tagId })),
        });
      }

      return tx.article.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug?.trim(),
          content: dto.content,
          excerpt: dto.excerpt,
          festivalId: dto.festivalId,
          categoryId: dto.categoryId,
          coverMediaAssetId: dto.coverMediaAssetId,
          socialImageMediaAssetId: dto.socialImageMediaAssetId,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          canonicalUrl: dto.canonicalUrl,
        },
        include: ARTICLE_INCLUDE,
      });
    });
  }

  async publish(id: string, actorUserId?: string): Promise<Article> {
    const before = await this.findOneForManagement(id);
    const article = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.PUBLISHED, publishedAt: new Date() },
      include: ARTICLE_INCLUDE,
    });
    await recordAuditLog(this.prisma, {
      userId: actorUserId,
      action: AuditAction.PUBLISH,
      entityType: 'cms.article',
      entityId: id,
      oldValues: { status: before.status },
      newValues: { status: article.status, publishedAt: article.publishedAt },
    });
    return article;
  }

  async unpublish(id: string, actorUserId?: string): Promise<Article> {
    const before = await this.findOneForManagement(id);
    const article = await this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.DRAFT },
      include: ARTICLE_INCLUDE,
    });
    await recordAuditLog(this.prisma, {
      userId: actorUserId,
      action: AuditAction.UNPUBLISH,
      entityType: 'cms.article',
      entityId: id,
      oldValues: { status: before.status },
      newValues: { status: article.status },
    });
    return article;
  }

  async remove(id: string): Promise<void> {
    await this.findOneForManagement(id);
    await this.prisma.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listVersions(id: string) {
    await this.findOneForManagement(id);
    return this.prisma.articleVersion.findMany({
      where: { articleId: id },
      orderBy: { versionNumber: 'desc' },
    });
  }

  private async paginateArticles(
    where: Prisma.ArticleWhereInput,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Article>> {
    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { publishedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.article.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  private async assertFestivalExists(id?: string): Promise<void> {
    if (!id) return;
    const festival = await this.prisma.festival.findUnique({ where: { id } });
    if (!festival || festival.deletedAt) {
      throw new BadRequestException('La festividad indicada no existe');
    }
  }

  private async assertCategoryExists(id?: string): Promise<void> {
    if (!id) return;
    const category = await this.prisma.articleCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new BadRequestException('La categoría indicada no existe');
    }
  }

  private async assertMediaAssetExists(id?: string): Promise<void> {
    if (!id) return;
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt) {
      throw new BadRequestException('El archivo de media indicado no existe');
    }
  }

  private async assertTagsExist(tagIds?: string[]): Promise<void> {
    if (!tagIds || tagIds.length === 0) return;
    const count = await this.prisma.tag.count({
      where: { id: { in: tagIds } },
    });
    if (count !== tagIds.length) {
      throw new BadRequestException('Alguno de los tagIds indicados no existe');
    }
  }
}
