import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttachableType, MediaAttachment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaAttachmentDto } from './dto/create-media-attachment.dto';

@Injectable()
export class MediaAttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMediaAttachmentDto): Promise<MediaAttachment> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: dto.mediaAssetId },
    });
    if (!asset || asset.deletedAt) {
      throw new BadRequestException('El archivo de media indicado no existe');
    }
    await this.assertAttachableExists(dto.attachableType, dto.attachableId);

    return this.prisma.mediaAttachment.create({
      data: {
        mediaAssetId: dto.mediaAssetId,
        attachableType: dto.attachableType,
        attachableId: dto.attachableId,
        role: dto.role,
        order: dto.order,
        caption: dto.caption,
      },
    });
  }

  findByAttachable(
    attachableType: AttachableType,
    attachableId: string,
  ): Promise<MediaAttachment[]> {
    return this.prisma.mediaAttachment.findMany({
      where: { attachableType, attachableId },
      include: { mediaAsset: true },
      orderBy: [{ role: 'asc' }, { order: 'asc' }],
    });
  }

  async remove(id: string): Promise<void> {
    const attachment = await this.prisma.mediaAttachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException('Vínculo de media no encontrado');
    }
    await this.prisma.mediaAttachment.delete({ where: { id } });
  }

  /**
   * Mirrors the DB trigger (media.validate_media_attachment_attachable) at
   * the application layer so a bad attachableId comes back as a clear 400
   * instead of an opaque 500 from an unmapped Postgres RAISE EXCEPTION.
   */
  private async assertAttachableExists(
    type: AttachableType,
    id: string,
  ): Promise<void> {
    const exists = await this.attachableExists(type, id);
    if (!exists) {
      throw new BadRequestException(
        `No existe ningún ${type} con id ${id} para adjuntar el archivo`,
      );
    }
  }

  private async attachableExists(
    type: AttachableType,
    id: string,
  ): Promise<boolean> {
    switch (type) {
      case AttachableType.PROCESSIONAL_STEP:
        return (
          (await this.prisma.processionalStep.findUnique({ where: { id } })) !==
          null
        );
      case AttachableType.RELIGIOUS_IMAGE:
        return (
          (await this.prisma.religiousImage.findUnique({ where: { id } })) !==
          null
        );
      case AttachableType.EVENT:
        return (await this.prisma.event.findUnique({ where: { id } })) !== null;
      case AttachableType.PERSON:
        return (
          (await this.prisma.person.findUnique({ where: { id } })) !== null
        );
      case AttachableType.ARTICLE:
        return (
          (await this.prisma.article.findUnique({ where: { id } })) !== null
        );
      case AttachableType.RELIGIOUS_SITE:
        return (
          (await this.prisma.religiousSite.findUnique({ where: { id } })) !==
          null
        );
      case AttachableType.FESTIVAL:
        return (
          (await this.prisma.festival.findUnique({ where: { id } })) !== null
        );
      case AttachableType.DOCUMENT:
        return (
          (await this.prisma.document.findUnique({ where: { id } })) !== null
        );
    }
  }
}
