import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Business, BusinessStatus } from '@prisma/client';
import { recordAuditLog } from '../common/audit-log.util';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { slugify } from '../heritage/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { FindBusinessesDto } from './dto/find-businesses.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusinessDto): Promise<Business> {
    await this.assertCategoryExists(dto.categoryId);
    await this.assertOrganizationExists(dto.organizationId);
    await this.assertMediaAssetExists(dto.logoMediaAssetId);

    return this.prisma.business.create({
      data: {
        organizationId: dto.organizationId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        description: dto.description,
        logoMediaAssetId: dto.logoMediaAssetId,
      },
    });
  }

  /** Listado público: solo negocios ACTIVE. */
  async findAllPublic(
    query: FindBusinessesDto,
  ): Promise<PaginatedResult<Business>> {
    const where = {
      deletedAt: null,
      status: BusinessStatus.ACTIVE,
      categoryId: query.categoryId,
    };
    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.business.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  /** Listado de gestión: todos los estados, filtrable. */
  async findAllManaged(
    query: FindBusinessesDto,
  ): Promise<PaginatedResult<Business>> {
    const where = {
      deletedAt: null,
      categoryId: query.categoryId,
      status: query.status,
    };
    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.business.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business || business.deletedAt) {
      throw new NotFoundException('Negocio no encontrado');
    }
    return business;
  }

  async update(id: string, dto: UpdateBusinessDto): Promise<Business> {
    await this.findOne(id);
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    if (dto.organizationId) {
      await this.assertOrganizationExists(dto.organizationId);
    }
    await this.assertMediaAssetExists(dto.logoMediaAssetId);

    return this.prisma.business.update({
      where: { id },
      data: {
        organizationId: dto.organizationId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug?.trim(),
        description: dto.description,
        logoMediaAssetId: dto.logoMediaAssetId,
      },
    });
  }

  async setStatus(
    id: string,
    status: BusinessStatus,
    actorUserId?: string,
  ): Promise<Business> {
    const before = await this.findOne(id);
    const business = await this.prisma.business.update({
      where: { id },
      data: { status },
    });
    await recordAuditLog(this.prisma, {
      userId: actorUserId,
      action: AuditAction.UPDATE,
      entityType: 'business.business',
      entityId: id,
      oldValues: { status: before.status },
      newValues: { status: business.status },
    });
    return business;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.business.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.businessCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        'La categoría de negocio indicada no existe',
      );
    }
  }

  private async assertOrganizationExists(
    organizationId?: string,
  ): Promise<void> {
    if (!organizationId) return;
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization || organization.deletedAt) {
      throw new BadRequestException('La organización indicada no existe');
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
