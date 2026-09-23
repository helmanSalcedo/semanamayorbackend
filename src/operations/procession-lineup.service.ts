import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcessionStep } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddProcessionLineupItemDto } from './dto/add-procession-lineup-item.dto';
import { ProcessionsService } from './processions.service';

@Injectable()
export class ProcessionLineupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processionsService: ProcessionsService,
  ) {}

  async add(
    festivalId: string,
    editionId: string,
    processionId: string,
    dto: AddProcessionLineupItemDto,
  ): Promise<ProcessionStep> {
    await this.processionsService.findOne(festivalId, editionId, processionId);

    const step = await this.prisma.processionalStep.findUnique({
      where: { id: dto.processionalStepId },
    });
    if (!step || step.festivalId !== festivalId || step.deletedAt) {
      throw new BadRequestException(
        'El paso procesional indicado no existe o no pertenece a esta festividad',
      );
    }

    return this.prisma.processionStep.create({
      data: {
        processionId,
        processionalStepId: dto.processionalStepId,
        order: dto.order,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    festivalId: string,
    editionId: string,
    processionId: string,
  ): Promise<ProcessionStep[]> {
    await this.processionsService.findOne(festivalId, editionId, processionId);
    return this.prisma.processionStep.findMany({
      where: { processionId },
      include: { processionalStep: true },
      orderBy: { order: 'asc' },
    });
  }

  async remove(
    festivalId: string,
    editionId: string,
    processionId: string,
    itemId: string,
  ): Promise<void> {
    await this.processionsService.findOne(festivalId, editionId, processionId);
    const item = await this.prisma.processionStep.findUnique({
      where: { id: itemId },
    });
    if (!item || item.processionId !== processionId) {
      throw new NotFoundException('Elemento del recorrido no encontrado');
    }
    await this.prisma.processionStep.delete({ where: { id: itemId } });
  }
}
