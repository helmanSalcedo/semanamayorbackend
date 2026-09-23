import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Festival } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFestivalDto } from './dto/create-festival.dto';
import { UpdateFestivalDto } from './dto/update-festival.dto';
import { slugify } from './slug.util';

@Injectable()
export class FestivalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFestivalDto): Promise<Festival> {
    const municipality = await this.prisma.municipality.findUnique({
      where: { id: dto.municipalityId },
    });
    if (!municipality) {
      throw new BadRequestException('El municipio indicado no existe');
    }

    return this.prisma.festival.create({
      data: {
        municipalityId: dto.municipalityId,
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        shortDescription: dto.shortDescription,
        description: dto.description,
        historicalDescription: dto.historicalDescription,
        startMonth: dto.startMonth,
        endMonth: dto.endMonth,
      },
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Festival>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.festival.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.festival.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Festival> {
    const festival = await this.prisma.festival.findUnique({ where: { id } });
    if (!festival || festival.deletedAt) {
      throw new NotFoundException('Festividad no encontrada');
    }
    return festival;
  }

  async update(id: string, dto: UpdateFestivalDto): Promise<Festival> {
    await this.findOne(id);

    if (dto.municipalityId) {
      const municipality = await this.prisma.municipality.findUnique({
        where: { id: dto.municipalityId },
      });
      if (!municipality) {
        throw new BadRequestException('El municipio indicado no existe');
      }
    }

    return this.prisma.festival.update({
      where: { id },
      data: {
        municipalityId: dto.municipalityId,
        name: dto.name,
        // Slug is only touched when explicitly provided — regenerating it
        // from `name` on every update would silently break existing links.
        slug: dto.slug?.trim(),
        shortDescription: dto.shortDescription,
        description: dto.description,
        historicalDescription: dto.historicalDescription,
        startMonth: dto.startMonth,
        endMonth: dto.endMonth,
        status: dto.status,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.festival.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
