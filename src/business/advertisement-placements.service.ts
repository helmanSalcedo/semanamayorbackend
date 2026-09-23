import { Injectable, NotFoundException } from '@nestjs/common';
import { AdvertisementPlacement } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvertisementPlacementDto } from './dto/create-advertisement-placement.dto';

@Injectable()
export class AdvertisementPlacementsService {
  constructor(private readonly prisma: PrismaService) {}

  async add(
    advertisementId: string,
    dto: CreateAdvertisementPlacementDto,
  ): Promise<AdvertisementPlacement> {
    await this.assertAdvertisementExists(advertisementId);
    return this.prisma.advertisementPlacement.create({
      data: {
        advertisementId,
        placementZone: dto.placementZone,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAll(advertisementId: string): Promise<AdvertisementPlacement[]> {
    await this.assertAdvertisementExists(advertisementId);
    return this.prisma.advertisementPlacement.findMany({
      where: { advertisementId },
    });
  }

  async remove(advertisementId: string, id: string): Promise<void> {
    await this.assertAdvertisementExists(advertisementId);
    const placement = await this.findOneOrThrow(id);
    if (placement.advertisementId !== advertisementId) {
      throw new NotFoundException('Ubicación de anuncio no encontrada');
    }
    await this.prisma.advertisementPlacement.delete({ where: { id } });
  }

  async recordImpression(id: string): Promise<AdvertisementPlacement> {
    await this.findOneOrThrow(id);
    return this.prisma.advertisementPlacement.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
  }

  async recordClick(id: string): Promise<AdvertisementPlacement> {
    await this.findOneOrThrow(id);
    return this.prisma.advertisementPlacement.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }

  private async findOneOrThrow(id: string): Promise<AdvertisementPlacement> {
    const placement = await this.prisma.advertisementPlacement.findUnique({
      where: { id },
    });
    if (!placement) {
      throw new NotFoundException('Ubicación de anuncio no encontrada');
    }
    return placement;
  }

  private async assertAdvertisementExists(id: string): Promise<void> {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) {
      throw new NotFoundException('Anuncio no encontrado');
    }
  }
}
