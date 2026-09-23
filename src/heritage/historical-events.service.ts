import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HistoricalEvent, Prisma } from '@prisma/client';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistoricalEventDto } from './dto/create-historical-event.dto';
import { FindHistoricalEventsDto } from './dto/find-historical-events.dto';
import { UpdateHistoricalEventDto } from './dto/update-historical-event.dto';
import { slugify } from './slug.util';

@Injectable()
export class HistoricalEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHistoricalEventDto): Promise<HistoricalEvent> {
    if (dto.festivalId) {
      const festival = await this.prisma.festival.findUnique({
        where: { id: dto.festivalId },
      });
      if (!festival || festival.deletedAt) {
        throw new BadRequestException('La festividad indicada no existe');
      }
    }
    if (dto.periodId) {
      const period = await this.prisma.historicalPeriod.findUnique({
        where: { id: dto.periodId },
      });
      if (!period) {
        throw new BadRequestException(
          'El periodo histórico indicado no existe',
        );
      }
    }

    return this.prisma.historicalEvent.create({
      data: {
        title: dto.title,
        slug: dto.slug?.trim() || slugify(dto.title),
        festivalId: dto.festivalId,
        periodId: dto.periodId,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        datePrecision: dto.datePrecision,
        description: dto.description,
        content: dto.content,
        reliabilityLevel: dto.reliabilityLevel,
        editorialNotes: dto.editorialNotes,
      },
    });
  }

  async findAll(
    query: FindHistoricalEventsDto,
  ): Promise<PaginatedResult<HistoricalEvent>> {
    const where: Prisma.HistoricalEventWhereInput = {
      deletedAt: null,
      festivalId: query.festivalId,
      periodId: query.periodId,
    };
    const [data, total] = await Promise.all([
      this.prisma.historicalEvent.findMany({
        where,
        orderBy: { eventDate: 'asc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.historicalEvent.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string): Promise<HistoricalEvent> {
    const event = await this.prisma.historicalEvent.findUnique({
      where: { id },
    });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Hecho histórico no encontrado');
    }
    return event;
  }

  async update(
    id: string,
    dto: UpdateHistoricalEventDto,
  ): Promise<HistoricalEvent> {
    await this.findOne(id);
    if (dto.festivalId) {
      const festival = await this.prisma.festival.findUnique({
        where: { id: dto.festivalId },
      });
      if (!festival || festival.deletedAt) {
        throw new BadRequestException('La festividad indicada no existe');
      }
    }
    if (dto.periodId) {
      const period = await this.prisma.historicalPeriod.findUnique({
        where: { id: dto.periodId },
      });
      if (!period) {
        throw new BadRequestException(
          'El periodo histórico indicado no existe',
        );
      }
    }

    return this.prisma.historicalEvent.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug?.trim(),
        festivalId: dto.festivalId,
        periodId: dto.periodId,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        datePrecision: dto.datePrecision,
        description: dto.description,
        content: dto.content,
        reliabilityLevel: dto.reliabilityLevel,
        editorialNotes: dto.editorialNotes,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.historicalEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
