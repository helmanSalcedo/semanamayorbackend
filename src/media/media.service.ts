import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaAsset } from '@prisma/client';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { resolveMediaType } from './media-type.util';

const STORAGE_PROVIDER = 'firebase';

export interface MediaAssetResponse {
  id: string;
  type: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number | null;
  checksum: string | null;
  createdAt: Date;
}

@Injectable()
export class MediaService {
  private readonly maxFileSizeBytes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    configService: ConfigService,
  ) {
    this.maxFileSizeBytes =
      configService.get<AppConfig>('app')!.storage.maxFileSizeMb * 1024 * 1024;
  }

  async upload(
    file: Express.Multer.File,
    uploadedByUserId: string,
    festivalEditionId?: string,
  ): Promise<MediaAssetResponse> {
    const mediaType = resolveMediaType(file.mimetype);
    if (!mediaType) {
      throw new BadRequestException(
        `Tipo de archivo no soportado: ${file.mimetype} (solo imagen, video, audio o PDF)`,
      );
    }

    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo permitido (${Math.floor(this.maxFileSizeBytes / (1024 * 1024))}MB)`,
      );
    }

    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = await this.resolveFolder(festivalEditionId);
    const path = `${folder}/${mediaType.toLowerCase()}/${randomUUID()}-${sanitizedName}`;

    const { url, storageKey } = await this.storageService.upload(
      file.buffer,
      path,
      file.mimetype,
    );

    const asset = await this.prisma.mediaAsset.create({
      data: {
        type: mediaType,
        url,
        storageProvider: STORAGE_PROVIDER,
        storageKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        checksum,
        uploadedByUserId,
      },
    });

    return this.toResponse(asset);
  }

  async findById(id: string): Promise<MediaAssetResponse> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return this.toResponse(asset);
  }

  async remove(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // Soft-delete keeps the row (and any attachments referencing it) for
    // audit purposes; the underlying file is hard-deleted since there's no
    // value in paying to keep storage for content an admin explicitly removed.
    await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.storageService.delete(asset.storageKey);
  }

  /**
   * Organizes storage by cultural entity — festivals/{slug}/{año}/{tipo}/...
   * — instead of by upload date, so content stays browseable by festival
   * edition in the bucket itself. Falls back to general/ for uploads not
   * tied to a specific edition (e.g. business directory photos).
   */
  private async resolveFolder(festivalEditionId?: string): Promise<string> {
    if (!festivalEditionId) {
      return 'general';
    }

    const edition = await this.prisma.festivalEdition.findUnique({
      where: { id: festivalEditionId },
      include: { festival: { select: { slug: true } } },
    });
    if (!edition) {
      throw new BadRequestException(
        'La edición de festival indicada no existe',
      );
    }

    return `festivals/${edition.festival.slug}/${edition.year}`;
  }

  private toResponse(asset: MediaAsset): MediaAssetResponse {
    return {
      id: asset.id,
      type: asset.type,
      url: asset.url,
      filename: asset.filename,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes === null ? null : Number(asset.sizeBytes),
      checksum: asset.checksum,
      createdAt: asset.createdAt,
    };
  }
}
