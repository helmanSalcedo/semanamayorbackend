import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Gallery, Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { slugify } from '../heritage/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@Injectable()
export class GalleriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGalleryDto): Promise<Gallery> {
    await this.assertFestivalEditionExists(dto.festivalEditionId);
    await this.assertMediaAssetExists(dto.coverMediaAssetId);

    return this.prisma.gallery.create({
      data: {
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        description: dto.description,
        festivalEditionId: dto.festivalEditionId,
        coverMediaAssetId: dto.coverMediaAssetId,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    festivalEditionId?: string,
  ): Promise<PaginatedResult<Gallery>> {
    const where: Prisma.GalleryWhereInput = {
      deletedAt: null,
      festivalEditionId,
    };
    const [data, total] = await Promise.all([
      this.prisma.gallery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.gallery.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Gallery> {
    const gallery = await this.prisma.gallery.findUnique({ where: { id } });
    if (!gallery || gallery.deletedAt) {
      throw new NotFoundException('Galería no encontrada');
    }
    return gallery;
  }

  async update(id: string, dto: UpdateGalleryDto): Promise<Gallery> {
    await this.findOne(id);
    await this.assertFestivalEditionExists(dto.festivalEditionId);
    await this.assertMediaAssetExists(dto.coverMediaAssetId);

    return this.prisma.gallery.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug?.trim(),
        description: dto.description,
        festivalEditionId: dto.festivalEditionId,
        coverMediaAssetId: dto.coverMediaAssetId,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.gallery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertFestivalEditionExists(id?: string): Promise<void> {
    if (!id) {
      return;
    }
    const edition = await this.prisma.festivalEdition.findUnique({
      where: { id },
    });
    if (!edition) {
      throw new BadRequestException(
        'La edición de festival indicada no existe',
      );
    }
  }

  private async assertMediaAssetExists(id?: string): Promise<void> {
    if (!id) {
      return;
    }
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt) {
      throw new BadRequestException('El archivo de media indicado no existe');
    }
  }
}
