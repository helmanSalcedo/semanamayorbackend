import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReligiousSite } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReligiousSiteDto } from './dto/create-religious-site.dto';
import { UpdateReligiousSiteDto } from './dto/update-religious-site.dto';
import { slugify } from './slug.util';

@Injectable()
export class ReligiousSitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReligiousSiteDto): Promise<ReligiousSite> {
    await this.assertMunicipalityExists(dto.municipalityId);

    return this.prisma.religiousSite.create({
      data: {
        municipalityId: dto.municipalityId,
        type: dto.type,
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        history: dto.history,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<ReligiousSite>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.religiousSite.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.religiousSite.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<ReligiousSite> {
    const site = await this.prisma.religiousSite.findUnique({ where: { id } });
    if (!site || site.deletedAt) {
      throw new NotFoundException('Sitio religioso no encontrado');
    }
    return site;
  }

  async update(
    id: string,
    dto: UpdateReligiousSiteDto,
  ): Promise<ReligiousSite> {
    await this.findOne(id);
    if (dto.municipalityId) {
      await this.assertMunicipalityExists(dto.municipalityId);
    }

    return this.prisma.religiousSite.update({
      where: { id },
      data: {
        municipalityId: dto.municipalityId,
        type: dto.type,
        name: dto.name,
        slug: dto.slug?.trim(),
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        history: dto.history,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.religiousSite.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertMunicipalityExists(
    municipalityId: string,
  ): Promise<void> {
    const municipality = await this.prisma.municipality.findUnique({
      where: { id: municipalityId },
    });
    if (!municipality) {
      throw new BadRequestException('El municipio indicado no existe');
    }
  }
}
