import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStep } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddEventStepDto } from './dto/add-event-step.dto';
import { EventsService } from './events.service';

@Injectable()
export class EventStepsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async add(
    festivalId: string,
    editionId: string,
    eventId: string,
    dto: AddEventStepDto,
  ): Promise<EventStep> {
    await this.eventsService.findOne(festivalId, editionId, eventId);

    const step = await this.prisma.processionalStep.findUnique({
      where: { id: dto.processionalStepId },
    });
    if (!step || step.festivalId !== festivalId || step.deletedAt) {
      throw new BadRequestException(
        'El paso procesional indicado no existe o no pertenece a esta festividad',
      );
    }

    return this.prisma.eventStep.create({
      data: {
        eventId,
        processionalStepId: dto.processionalStepId,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    festivalId: string,
    editionId: string,
    eventId: string,
  ): Promise<EventStep[]> {
    await this.eventsService.findOne(festivalId, editionId, eventId);
    return this.prisma.eventStep.findMany({
      where: { eventId },
      include: { processionalStep: true },
    });
  }

  async remove(
    festivalId: string,
    editionId: string,
    eventId: string,
    itemId: string,
  ): Promise<void> {
    await this.eventsService.findOne(festivalId, editionId, eventId);
    const item = await this.prisma.eventStep.findUnique({
      where: { id: itemId },
    });
    if (!item || item.eventId !== eventId) {
      throw new NotFoundException('Vínculo evento-paso no encontrado');
    }
    await this.prisma.eventStep.delete({ where: { id: itemId } });
  }
}
