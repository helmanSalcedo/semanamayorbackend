import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdvertisementCampaign } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvertisementCampaignDto } from './dto/create-advertisement-campaign.dto';
import { UpdateAdvertisementCampaignDto } from './dto/update-advertisement-campaign.dto';

@Injectable()
export class AdvertisementCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateAdvertisementCampaignDto,
  ): Promise<AdvertisementCampaign> {
    await this.assertOrganizationExists(dto.organizationId);
    return this.prisma.advertisementCampaign.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        budget: dto.budget,
        currency: dto.currency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    organizationId?: string,
  ): Promise<PaginatedResult<AdvertisementCampaign>> {
    const where = { organizationId };
    const [data, total] = await Promise.all([
      this.prisma.advertisementCampaign.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.advertisementCampaign.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<AdvertisementCampaign> {
    const campaign = await this.prisma.advertisementCampaign.findUnique({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException('Campaña publicitaria no encontrada');
    }
    return campaign;
  }

  async update(
    id: string,
    dto: UpdateAdvertisementCampaignDto,
  ): Promise<AdvertisementCampaign> {
    await this.findOne(id);
    if (dto.organizationId) {
      await this.assertOrganizationExists(dto.organizationId);
    }
    return this.prisma.advertisementCampaign.update({
      where: { id },
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        budget: dto.budget,
        currency: dto.currency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.advertisementCampaign.delete({ where: { id } });
  }

  private async assertOrganizationExists(id: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization || organization.deletedAt) {
      throw new BadRequestException('La organización indicada no existe');
    }
  }
}
