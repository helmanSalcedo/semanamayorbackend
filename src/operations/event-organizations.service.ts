import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventOrganization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddEventOrganizationDto } from './dto/add-event-organization.dto';
import { EventsService } from './events.service';

@Injectable()
export class EventOrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async add(
    festivalId: string,
    editionId: string,
    eventId: string,
    dto: AddEventOrganizationDto,
  ): Promise<EventOrganization> {
    await this.eventsService.findOne(festivalId, editionId, eventId);

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!organization) {
      throw new BadRequestException('La organización indicada no existe');
    }

    return this.prisma.eventOrganization.create({
      data: {
        eventId,
        organizationId: dto.organizationId,
        role: dto.role,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    festivalId: string,
    editionId: string,
    eventId: string,
  ): Promise<EventOrganization[]> {
    await this.eventsService.findOne(festivalId, editionId, eventId);
    return this.prisma.eventOrganization.findMany({
      where: { eventId },
      include: { organization: true },
    });
  }

  async remove(
    festivalId: string,
    editionId: string,
    eventId: string,
    itemId: string,
  ): Promise<void> {
    await this.eventsService.findOne(festivalId, editionId, eventId);
    const item = await this.prisma.eventOrganization.findUnique({
      where: { id: itemId },
    });
    if (!item || item.eventId !== eventId) {
      throw new NotFoundException('Vínculo evento-organización no encontrado');
    }
    await this.prisma.eventOrganization.delete({ where: { id: itemId } });
  }
}
