import { Injectable, NotFoundException } from '@nestjs/common';
import { HistoricalPeriod } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistoricalPeriodDto } from './dto/create-historical-period.dto';
import { UpdateHistoricalPeriodDto } from './dto/update-historical-period.dto';
import { slugify } from './slug.util';

@Injectable()
export class HistoricalPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateHistoricalPeriodDto): Promise<HistoricalPeriod> {
    return this.prisma.historicalPeriod.create({
      data: {
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        startYear: dto.startYear,
        endYear: dto.endYear,
        description: dto.description,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<HistoricalPeriod>> {
    const [data, total] = await Promise.all([
      this.prisma.historicalPeriod.findMany({
        orderBy: { startYear: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.historicalPeriod.count(),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<HistoricalPeriod> {
    const period = await this.prisma.historicalPeriod.findUnique({
      where: { id },
    });
    if (!period) {
      throw new NotFoundException('Periodo histórico no encontrado');
    }
    return period;
  }

  async update(
    id: string,
    dto: UpdateHistoricalPeriodDto,
  ): Promise<HistoricalPeriod> {
    await this.findOne(id);
    return this.prisma.historicalPeriod.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug?.trim(),
        startYear: dto.startYear,
        endYear: dto.endYear,
        description: dto.description,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // No soft-delete column; events referencing this period fall back to
    // periodId = NULL (onDelete: SetNull), so a hard delete is safe.
    await this.prisma.historicalPeriod.delete({ where: { id } });
  }
}
