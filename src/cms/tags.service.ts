import { Injectable, NotFoundException } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { slugify } from '../heritage/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTagDto): Promise<Tag> {
    return this.prisma.tag.create({
      data: { name: dto.name, slug: dto.slug?.trim() || slugify(dto.name) },
    });
  }

  findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Etiqueta no encontrada');
    }
    return tag;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.tag.delete({ where: { id } });
  }
}
