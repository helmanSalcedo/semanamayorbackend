import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event } from '@prisma/client';
import { FestivalEditionsService } from '../heritage/festival-editions.service';
import { slugify } from '../heritage/slug.util';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly festivalEditionsService: FestivalEditionsService,
  ) {}

  async create(
    festivalId: string,
    editionId: string,
    dto: CreateEventDto,
  ): Promise<Event> {
    await this.festivalEditionsService.findOne(festivalId, editionId);
    await this.assertReligiousSiteExists(dto.religiousSiteId);

    return this.prisma.event.create({
      data: {
        festivalEditionId: editionId,
        title: dto.title,
        slug: dto.slug?.trim() || slugify(dto.title),
        eventType: dto.eventType,
        startDatetime: new Date(dto.startDatetime),
        endDatetime: dto.endDatetime ? new Date(dto.endDatetime) : undefined,
        description: dto.description,
        religiousSiteId: dto.religiousSiteId,
        locationText: dto.locationText,
        capacity: dto.capacity,
      },
    });
  }

  async findAllByEdition(
    festivalId: string,
    editionId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Event>> {
    await this.festivalEditionsService.findOne(festivalId, editionId);
    const where = { festivalEditionId: editionId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { startDatetime: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.event.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(
    festivalId: string,
    editionId: string,
    eventId: string,
  ): Promise<Event> {
    await this.festivalEditionsService.findOne(festivalId, editionId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.festivalEditionId !== editionId || event.deletedAt) {
      throw new NotFoundException('Evento no encontrado');
    }
    return event;
  }

  async update(
    festivalId: string,
    editionId: string,
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<Event> {
    await this.findOne(festivalId, editionId, eventId);
    await this.assertReligiousSiteExists(dto.religiousSiteId);

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        slug: dto.slug?.trim(),
        eventType: dto.eventType,
        startDatetime: dto.startDatetime
          ? new Date(dto.startDatetime)
          : undefined,
        endDatetime: dto.endDatetime ? new Date(dto.endDatetime) : undefined,
        description: dto.description,
        religiousSiteId: dto.religiousSiteId,
        locationText: dto.locationText,
        capacity: dto.capacity,
        status: dto.status,
      },
    });
  }

  async remove(
    festivalId: string,
    editionId: string,
    eventId: string,
  ): Promise<void> {
    await this.findOne(festivalId, editionId, eventId);
    await this.prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
  }

  private async assertReligiousSiteExists(
    religiousSiteId?: string,
  ): Promise<void> {
    if (!religiousSiteId) {
      return;
    }
    const site = await this.prisma.religiousSite.findUnique({
      where: { id: religiousSiteId },
    });
    if (!site || site.deletedAt) {
      throw new BadRequestException('El sitio religioso indicado no existe');
    }
  }
}
