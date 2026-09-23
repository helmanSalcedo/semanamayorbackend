import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleCategory } from '@prisma/client';
import { slugify } from '../heritage/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';

@Injectable()
export class ArticleCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateArticleCategoryDto): Promise<ArticleCategory> {
    return this.prisma.articleCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        description: dto.description,
      },
    });
  }

  findAll(): Promise<ArticleCategory[]> {
    return this.prisma.articleCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<ArticleCategory> {
    const category = await this.prisma.articleCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateArticleCategoryDto,
  ): Promise<ArticleCategory> {
    await this.findOne(id);
    return this.prisma.articleCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug?.trim(),
        description: dto.description,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // Articles referencing this category fall back to categoryId = NULL
    // (onDelete: SetNull), so a hard delete is safe.
    await this.prisma.articleCategory.delete({ where: { id } });
  }
}
