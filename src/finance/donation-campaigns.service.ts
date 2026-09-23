import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DonationCampaign } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { slugify } from '../heritage/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationCampaignDto } from './dto/create-donation-campaign.dto';
import { UpdateDonationCampaignDto } from './dto/update-donation-campaign.dto';

@Injectable()
export class DonationCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDonationCampaignDto): Promise<DonationCampaign> {
    if (dto.festivalId) {
      const festival = await this.prisma.festival.findUnique({
        where: { id: dto.festivalId },
      });
      if (!festival || festival.deletedAt) {
        throw new BadRequestException('La festividad indicada no existe');
      }
    }

    return this.prisma.donationCampaign.create({
      data: {
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        festivalId: dto.festivalId,
        description: dto.description,
        goalAmount: dto.goalAmount,
        currency: dto.currency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<DonationCampaign>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.donationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.donationCampaign.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<DonationCampaign> {
    const campaign = await this.prisma.donationCampaign.findUnique({
      where: { id },
    });
    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException('Campaña de donación no encontrada');
    }
    return campaign;
  }

  async update(
    id: string,
    dto: UpdateDonationCampaignDto,
  ): Promise<DonationCampaign> {
    await this.findOne(id);
    if (dto.festivalId) {
      const festival = await this.prisma.festival.findUnique({
        where: { id: dto.festivalId },
      });
      if (!festival || festival.deletedAt) {
        throw new BadRequestException('La festividad indicada no existe');
      }
    }

    return this.prisma.donationCampaign.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug?.trim(),
        festivalId: dto.festivalId,
        description: dto.description,
        goalAmount: dto.goalAmount,
        currency: dto.currency,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.donationCampaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
