import { Injectable, NotFoundException } from '@nestjs/common';
import { FestivalEdition } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FestivalsService } from './festivals.service';
import { CreateFestivalEditionDto } from './dto/create-festival-edition.dto';
import { UpdateFestivalEditionDto } from './dto/update-festival-edition.dto';

@Injectable()
export class FestivalEditionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly festivalsService: FestivalsService,
  ) {}

  async create(
    festivalId: string,
    dto: CreateFestivalEditionDto,
  ): Promise<FestivalEdition> {
    await this.festivalsService.findOne(festivalId); // 404s if missing/deleted

    return this.prisma.festivalEdition.create({
      data: {
        festivalId,
        year: dto.year,
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        description: dto.description,
        officialProgramUrl: dto.officialProgramUrl,
      },
    });
  }

  async findAllByFestival(
    festivalId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<FestivalEdition>> {
    await this.festivalsService.findOne(festivalId);
    const where = { festivalId };
    const [data, total] = await Promise.all([
      this.prisma.festivalEdition.findMany({
        where,
        orderBy: { year: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.festivalEdition.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(
    festivalId: string,
    editionId: string,
  ): Promise<FestivalEdition> {
    const edition = await this.prisma.festivalEdition.findUnique({
      where: { id: editionId },
    });
    if (!edition || edition.festivalId !== festivalId) {
      throw new NotFoundException('Edición de festival no encontrada');
    }
    return edition;
  }

  async update(
    festivalId: string,
    editionId: string,
    dto: UpdateFestivalEditionDto,
  ): Promise<FestivalEdition> {
    await this.findOne(festivalId, editionId);

    return this.prisma.festivalEdition.update({
      where: { id: editionId },
      data: {
        year: dto.year,
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        description: dto.description,
        officialProgramUrl: dto.officialProgramUrl,
        status: dto.status,
      },
    });
  }

  async remove(festivalId: string, editionId: string): Promise<void> {
    await this.findOne(festivalId, editionId);
    // No soft-delete column on this table — a hard delete that's referenced
    // by processions/events/galleries will surface as a 409 via the global
    // Prisma-error mapping (FK constraint violation), which is correct: you
    // can't drop an edition that already has content hanging off it.
    await this.prisma.festivalEdition.delete({ where: { id: editionId } });
  }
}
