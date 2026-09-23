import { Injectable, NotFoundException } from '@nestjs/common';
import { ProcessionRoutePoint } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddRoutePointDto } from './dto/add-route-point.dto';
import { ProcessionRoutesService } from './procession-routes.service';

@Injectable()
export class RoutePointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routesService: ProcessionRoutesService,
  ) {}

  async add(
    festivalId: string,
    editionId: string,
    processionId: string,
    routeId: string,
    dto: AddRoutePointDto,
  ): Promise<ProcessionRoutePoint> {
    await this.routesService.findOne(
      festivalId,
      editionId,
      processionId,
      routeId,
    );
    return this.prisma.processionRoutePoint.create({
      data: {
        routeId,
        order: dto.order,
        latitude: dto.latitude,
        longitude: dto.longitude,
        streetName: dto.streetName,
        description: dto.description,
      },
    });
  }

  async remove(
    festivalId: string,
    editionId: string,
    processionId: string,
    routeId: string,
    pointId: string,
  ): Promise<void> {
    await this.routesService.findOne(
      festivalId,
      editionId,
      processionId,
      routeId,
    );
    const point = await this.prisma.processionRoutePoint.findUnique({
      where: { id: pointId },
    });
    if (!point || point.routeId !== routeId) {
      throw new NotFoundException('Punto de ruta no encontrado');
    }
    await this.prisma.processionRoutePoint.delete({ where: { id: pointId } });
  }
}
