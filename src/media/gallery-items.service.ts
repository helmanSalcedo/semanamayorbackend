import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GalleryItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddGalleryItemDto } from './dto/add-gallery-item.dto';
import { GalleriesService } from './galleries.service';

@Injectable()
export class GalleryItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly galleriesService: GalleriesService,
  ) {}

  async add(galleryId: string, dto: AddGalleryItemDto): Promise<GalleryItem> {
    await this.galleriesService.findOne(galleryId);

    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: dto.mediaAssetId },
    });
    if (!asset || asset.deletedAt) {
      throw new BadRequestException('El archivo de media indicado no existe');
    }

    return this.prisma.galleryItem.create({
      data: {
        galleryId,
        mediaAssetId: dto.mediaAssetId,
        order: dto.order,
        caption: dto.caption,
      },
    });
  }

  async findAllByGallery(galleryId: string): Promise<GalleryItem[]> {
    await this.galleriesService.findOne(galleryId);
    return this.prisma.galleryItem.findMany({
      where: { galleryId },
      include: { mediaAsset: true },
      orderBy: { order: 'asc' },
    });
  }

  async remove(galleryId: string, itemId: string): Promise<void> {
    const item = await this.prisma.galleryItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.galleryId !== galleryId) {
      throw new NotFoundException('Elemento de galería no encontrado');
    }
    await this.prisma.galleryItem.delete({ where: { id: itemId } });
  }
}
