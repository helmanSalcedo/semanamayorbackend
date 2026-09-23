import { Injectable, NotFoundException } from '@nestjs/common';
import { Procession } from '@prisma/client';
import { FestivalEditionsService } from '../heritage/festival-editions.service';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessionDto } from './dto/create-procession.dto';
import { UpdateProcessionDto } from './dto/update-procession.dto';

function toTimeDate(hhmm?: string): Date | undefined {
  return hhmm ? new Date(`1970-01-01T${hhmm}:00.000Z`) : undefined;
}

@Injectable()
export class ProcessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly festivalEditionsService: FestivalEditionsService,
  ) {}

  async create(
    festivalId: string,
    editionId: string,
    dto: CreateProcessionDto,
  ): Promise<Procession> {
    await this.festivalEditionsService.findOne(festivalId, editionId);

    return this.prisma.procession.create({
      data: {
        festivalEditionId: editionId,
        name: dto.name,
        date: new Date(dto.date),
        description: dto.description,
        startTime: toTimeDate(dto.startTime),
        estimatedEndTime: toTimeDate(dto.estimatedEndTime),
        startLocation: dto.startLocation,
        endLocation: dto.endLocation,
        order: dto.order,
      },
    });
  }

  async findAllByEdition(
    festivalId: string,
    editionId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Procession>> {
    await this.festivalEditionsService.findOne(festivalId, editionId);
    const where = { festivalEditionId: editionId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.procession.findMany({
        where,
        orderBy: [{ date: 'asc' }, { order: 'asc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.procession.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(
    festivalId: string,
    editionId: string,
    processionId: string,
  ): Promise<Procession> {
    await this.festivalEditionsService.findOne(festivalId, editionId);
    const procession = await this.prisma.procession.findUnique({
      where: { id: processionId },
    });
    if (
      !procession ||
      procession.festivalEditionId !== editionId ||
      procession.deletedAt
    ) {
      throw new NotFoundException('Procesión no encontrada');
    }
    return procession;
  }

  async update(
    festivalId: string,
    editionId: string,
    processionId: string,
    dto: UpdateProcessionDto,
  ): Promise<Procession> {
    await this.findOne(festivalId, editionId, processionId);

    return this.prisma.procession.update({
      where: { id: processionId },
      data: {
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        description: dto.description,
        startTime: toTimeDate(dto.startTime),
        estimatedEndTime: toTimeDate(dto.estimatedEndTime),
        startLocation: dto.startLocation,
        endLocation: dto.endLocation,
        order: dto.order,
        status: dto.status,
      },
    });
  }

  async remove(
    festivalId: string,
    editionId: string,
    processionId: string,
  ): Promise<void> {
    await this.findOne(festivalId, editionId, processionId);
    await this.prisma.procession.update({
      where: { id: processionId },
      data: { deletedAt: new Date() },
    });
  }
}
