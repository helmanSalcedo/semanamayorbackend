import { Injectable, NotFoundException } from '@nestjs/common';
import { ProcessionRoute } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessionRouteDto } from './dto/create-procession-route.dto';
import { ProcessionsService } from './processions.service';

@Injectable()
export class ProcessionRoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processionsService: ProcessionsService,
  ) {}

  async create(
    festivalId: string,
    editionId: string,
    processionId: string,
    dto: CreateProcessionRouteDto,
  ): Promise<ProcessionRoute> {
    await this.processionsService.findOne(festivalId, editionId, processionId);
    return this.prisma.processionRoute.create({
      data: { processionId, name: dto.name, description: dto.description },
    });
  }

  async findAll(
    festivalId: string,
    editionId: string,
    processionId: string,
  ): Promise<ProcessionRoute[]> {
    await this.processionsService.findOne(festivalId, editionId, processionId);
    return this.prisma.processionRoute.findMany({
      where: { processionId },
      include: { points: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(
    festivalId: string,
    editionId: string,
    processionId: string,
    routeId: string,
  ): Promise<ProcessionRoute> {
    await this.processionsService.findOne(festivalId, editionId, processionId);
    const route = await this.prisma.processionRoute.findUnique({
      where: { id: routeId },
      include: { points: { orderBy: { order: 'asc' } } },
    });
    if (!route || route.processionId !== processionId) {
      throw new NotFoundException('Ruta no encontrada');
    }
    return route;
  }

  async remove(
    festivalId: string,
    editionId: string,
    processionId: string,
    routeId: string,
  ): Promise<void> {
    await this.findOne(festivalId, editionId, processionId, routeId);
    // Cascade at the DB level removes the route's points too.
    await this.prisma.processionRoute.delete({ where: { id: routeId } });
  }
}
