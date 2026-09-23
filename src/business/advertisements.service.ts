import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Advertisement } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdvertisementCampaignsService } from './advertisement-campaigns.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignsService: AdvertisementCampaignsService,
  ) {}

  async create(
    campaignId: string,
    dto: CreateAdvertisementDto,
  ): Promise<Advertisement> {
    await this.campaignsService.findOne(campaignId);
    await this.assertMediaAssetExists(dto.creativeMediaAssetId);

    return this.prisma.advertisement.create({
      data: {
        campaignId,
        type: dto.type,
        creativeMediaAssetId: dto.creativeMediaAssetId,
        targetUrl: dto.targetUrl,
      },
    });
  }

  async findAll(campaignId: string): Promise<Advertisement[]> {
    await this.campaignsService.findOne(campaignId);
    return this.prisma.advertisement.findMany({ where: { campaignId } });
  }

  async findOne(campaignId: string, id: string): Promise<Advertisement> {
    await this.campaignsService.findOne(campaignId);
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad || ad.campaignId !== campaignId) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    return ad;
  }

  async update(
    campaignId: string,
    id: string,
    dto: UpdateAdvertisementDto,
  ): Promise<Advertisement> {
    await this.findOne(campaignId, id);
    await this.assertMediaAssetExists(dto.creativeMediaAssetId);

    return this.prisma.advertisement.update({
      where: { id },
      data: {
        type: dto.type,
        creativeMediaAssetId: dto.creativeMediaAssetId,
        targetUrl: dto.targetUrl,
        status: dto.status,
      },
    });
  }

  async remove(campaignId: string, id: string): Promise<void> {
    await this.findOne(campaignId, id);
    await this.prisma.advertisement.delete({ where: { id } });
  }

  private async assertMediaAssetExists(mediaAssetId?: string): Promise<void> {
    if (!mediaAssetId) return;
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });
    if (!asset || asset.deletedAt) {
      throw new BadRequestException('El archivo de media indicado no existe');
    }
  }
}
