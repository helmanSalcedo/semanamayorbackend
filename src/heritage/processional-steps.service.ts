import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttachableType,
  MediaAttachmentRole,
  ProcessionalStep,
} from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FestivalsService } from './festivals.service';
import { CreateProcessionalStepDto } from './dto/create-processional-step.dto';
import { UpdateProcessionalStepDto } from './dto/update-processional-step.dto';
import { slugify } from './slug.util';

@Injectable()
export class ProcessionalStepsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly festivalsService: FestivalsService,
  ) {}

  async create(
    festivalId: string,
    dto: CreateProcessionalStepDto,
  ): Promise<ProcessionalStep> {
    await this.festivalsService.findOne(festivalId);
    await this.assertMediaAssetExists(dto.primaryMediaAssetId);

    const step = await this.prisma.processionalStep.create({
      data: {
        festivalId,
        name: dto.name,
        slug: dto.slug?.trim() || slugify(dto.name),
        description: dto.description,
        historyText: dto.historyText,
        originYear: dto.originYear,
        provenance: dto.provenance,
        conservationStatus: dto.conservationStatus,
        incorporatedAt: dto.incorporatedAt
          ? new Date(dto.incorporatedAt)
          : undefined,
        processionalOrder: dto.processionalOrder,
        primaryMediaAssetId: dto.primaryMediaAssetId,
      },
    });

    if (dto.primaryMediaAssetId) {
      await this.syncPrimaryMediaAttachment(step.id, dto.primaryMediaAssetId);
    }

    return step;
  }

  async findAllByFestival(
    festivalId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<ProcessionalStep>> {
    await this.festivalsService.findOne(festivalId);
    const where = { festivalId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.processionalStep.findMany({
        where,
        orderBy: [{ processionalOrder: 'asc' }, { name: 'asc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.processionalStep.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(festivalId: string, stepId: string): Promise<ProcessionalStep> {
    const step = await this.prisma.processionalStep.findUnique({
      where: { id: stepId },
    });
    if (!step || step.festivalId !== festivalId || step.deletedAt) {
      throw new NotFoundException('Paso procesional no encontrado');
    }
    return step;
  }

  async update(
    festivalId: string,
    stepId: string,
    dto: UpdateProcessionalStepDto,
  ): Promise<ProcessionalStep> {
    await this.findOne(festivalId, stepId);
    await this.assertMediaAssetExists(dto.primaryMediaAssetId);

    const step = await this.prisma.processionalStep.update({
      where: { id: stepId },
      data: {
        name: dto.name,
        slug: dto.slug?.trim(),
        description: dto.description,
        historyText: dto.historyText,
        originYear: dto.originYear,
        provenance: dto.provenance,
        conservationStatus: dto.conservationStatus,
        incorporatedAt: dto.incorporatedAt
          ? new Date(dto.incorporatedAt)
          : undefined,
        processionalOrder: dto.processionalOrder,
        primaryMediaAssetId: dto.primaryMediaAssetId,
        status: dto.status,
      },
    });

    if (dto.primaryMediaAssetId) {
      await this.syncPrimaryMediaAttachment(stepId, dto.primaryMediaAssetId);
    }

    return step;
  }

  async remove(festivalId: string, stepId: string): Promise<void> {
    await this.findOne(festivalId, stepId);
    await this.prisma.processionalStep.update({
      where: { id: stepId },
      data: { deletedAt: new Date() },
    });
  }

  private async assertMediaAssetExists(mediaAssetId?: string): Promise<void> {
    if (!mediaAssetId) {
      return;
    }
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });
    if (!asset || asset.deletedAt) {
      throw new BadRequestException('El archivo de media indicado no existe');
    }
  }

  /**
   * primaryMediaAssetId is an intentional denormalization for fast listings
   * (see the schema comment); the real relation is a media.MediaAttachment
   * row with role=PRIMARY. Keep at most one PRIMARY attachment per step by
   * clearing any previous one before creating the new one.
   */
  private async syncPrimaryMediaAttachment(
    stepId: string,
    mediaAssetId: string,
  ): Promise<void> {
    await this.prisma.mediaAttachment.deleteMany({
      where: {
        attachableType: AttachableType.PROCESSIONAL_STEP,
        attachableId: stepId,
        role: MediaAttachmentRole.PRIMARY,
      },
    });
    await this.prisma.mediaAttachment.create({
      data: {
        mediaAssetId,
        attachableType: AttachableType.PROCESSIONAL_STEP,
        attachableId: stepId,
        role: MediaAttachmentRole.PRIMARY,
      },
    });
  }
}
