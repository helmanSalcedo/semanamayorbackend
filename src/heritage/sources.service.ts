import { Injectable, NotFoundException } from '@nestjs/common';
import { Source } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSourceDto): Promise<Source> {
    return this.prisma.source.create({
      data: {
        title: dto.title,
        sourceType: dto.sourceType,
        author: dto.author,
        publisher: dto.publisher,
        publicationDate: dto.publicationDate
          ? new Date(dto.publicationDate)
          : undefined,
        url: dto.url,
        isbn: dto.isbn,
        archiveReference: dto.archiveReference,
        reliabilityNotes: dto.reliabilityNotes,
      },
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Source>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.source.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.source.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Source> {
    const source = await this.prisma.source.findUnique({ where: { id } });
    if (!source || source.deletedAt) {
      throw new NotFoundException('Fuente no encontrada');
    }
    return source;
  }

  async update(id: string, dto: UpdateSourceDto): Promise<Source> {
    await this.findOne(id);
    return this.prisma.source.update({
      where: { id },
      data: {
        title: dto.title,
        sourceType: dto.sourceType,
        author: dto.author,
        publisher: dto.publisher,
        publicationDate: dto.publicationDate
          ? new Date(dto.publicationDate)
          : undefined,
        url: dto.url,
        isbn: dto.isbn,
        archiveReference: dto.archiveReference,
        reliabilityNotes: dto.reliabilityNotes,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.source.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
