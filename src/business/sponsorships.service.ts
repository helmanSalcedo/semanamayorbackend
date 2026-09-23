import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sponsorship, SponsorableType } from '@prisma/client';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { FindSponsorshipsDto } from './dto/find-sponsorships.dto';
import { UpdateSponsorshipStatusDto } from './dto/update-sponsorship-status.dto';

@Injectable()
export class SponsorshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSponsorshipDto): Promise<Sponsorship> {
    await this.assertOrganizationExists(dto.organizationId);
    await this.assertSponsorableExists(dto.sponsorableType, dto.sponsorableId);
    await this.assertPackageExists(dto.packageId);
    await this.assertCampaignExists(dto.campaignId);

    return this.prisma.sponsorship.create({
      data: {
        organizationId: dto.organizationId,
        sponsorableType: dto.sponsorableType,
        sponsorableId: dto.sponsorableId,
        packageId: dto.packageId,
        campaignId: dto.campaignId,
        amount: dto.amount,
        currency: dto.currency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAll(
    query: FindSponsorshipsDto,
  ): Promise<PaginatedResult<Sponsorship>> {
    const where = {
      organizationId: query.organizationId,
      sponsorableType: query.sponsorableType,
      sponsorableId: query.sponsorableId,
    };
    const [data, total] = await Promise.all([
      this.prisma.sponsorship.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.sponsorship.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string): Promise<Sponsorship> {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id },
    });
    if (!sponsorship) {
      throw new NotFoundException('Patrocinio no encontrado');
    }
    return sponsorship;
  }

  async updateStatus(
    id: string,
    dto: UpdateSponsorshipStatusDto,
  ): Promise<Sponsorship> {
    await this.findOne(id);
    return this.prisma.sponsorship.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.sponsorship.delete({ where: { id } });
  }

  private async assertOrganizationExists(id: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization || organization.deletedAt) {
      throw new BadRequestException('La organización indicada no existe');
    }
  }

  private async assertSponsorableExists(
    type: SponsorableType,
    id: string,
  ): Promise<void> {
    const exists = await this.sponsorableExists(type, id);
    if (!exists) {
      throw new BadRequestException(
        `La entidad patrocinada (${type}) indicada no existe`,
      );
    }
  }

  private async sponsorableExists(
    type: SponsorableType,
    id: string,
  ): Promise<boolean> {
    switch (type) {
      case SponsorableType.FESTIVAL: {
        const record = await this.prisma.festival.findUnique({
          where: { id },
        });
        return !!record && !record.deletedAt;
      }
      case SponsorableType.FESTIVAL_EDITION: {
        const record = await this.prisma.festivalEdition.findUnique({
          where: { id },
        });
        return !!record;
      }
      case SponsorableType.EVENT: {
        const record = await this.prisma.event.findUnique({ where: { id } });
        return !!record;
      }
      case SponsorableType.PROCESSIONAL_STEP: {
        const record = await this.prisma.processionalStep.findUnique({
          where: { id },
        });
        return !!record && !record.deletedAt;
      }
      case SponsorableType.DONATION_CAMPAIGN: {
        const record = await this.prisma.donationCampaign.findUnique({
          where: { id },
        });
        return !!record && !record.deletedAt;
      }
      default:
        return false;
    }
  }

  private async assertPackageExists(packageId?: string): Promise<void> {
    if (!packageId) return;
    const pkg = await this.prisma.sponsorshipPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new BadRequestException(
        'El paquete de patrocinio indicado no existe',
      );
    }
  }

  private async assertCampaignExists(campaignId?: string): Promise<void> {
    if (!campaignId) return;
    const campaign = await this.prisma.donationCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.deletedAt) {
      throw new BadRequestException('La campaña indicada no existe');
    }
  }
}
