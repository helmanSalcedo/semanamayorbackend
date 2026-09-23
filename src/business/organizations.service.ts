import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Organization } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    await this.assertTypeExists(dto.typeId);
    await this.assertMediaAssetExists(dto.logoMediaAssetId);

    return this.prisma.organization.create({
      data: {
        typeId: dto.typeId,
        name: dto.name,
        taxId: dto.taxId,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        website: dto.website,
        logoMediaAssetId: dto.logoMediaAssetId,
        description: dto.description,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    typeId?: string,
  ): Promise<PaginatedResult<Organization>> {
    const where = { deletedAt: null, typeId };
    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.organization.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization || organization.deletedAt) {
      throw new NotFoundException('Organización no encontrada');
    }
    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    await this.findOne(id);
    if (dto.typeId) {
      await this.assertTypeExists(dto.typeId);
    }
    await this.assertMediaAssetExists(dto.logoMediaAssetId);

    return this.prisma.organization.update({
      where: { id },
      data: {
        typeId: dto.typeId,
        name: dto.name,
        taxId: dto.taxId,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        website: dto.website,
        logoMediaAssetId: dto.logoMediaAssetId,
        description: dto.description,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertTypeExists(typeId: string): Promise<void> {
    const type = await this.prisma.organizationType.findUnique({
      where: { id: typeId },
    });
    if (!type) {
      throw new BadRequestException(
        'El tipo de organización indicado no existe',
      );
    }
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
