import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Document, DocumentVersion, Prisma } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto): Promise<Document> {
    await this.assertMediaAssetExists(dto.mediaAssetId);
    await this.assertSourceExists(dto.sourceId);

    return this.prisma.document.create({
      data: {
        title: dto.title,
        type: dto.type,
        description: dto.description,
        publicationDate: dto.publicationDate
          ? new Date(dto.publicationDate)
          : undefined,
        mediaAssetId: dto.mediaAssetId,
        sourceId: dto.sourceId,
      },
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Document>> {
    const where: Prisma.DocumentWhereInput = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.document.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document || document.deletedAt) {
      throw new NotFoundException('Documento no encontrado');
    }
    return document;
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    actorUserId: string | undefined,
  ): Promise<Document> {
    const current = await this.findOne(id);
    await this.assertMediaAssetExists(dto.mediaAssetId);
    await this.assertSourceExists(dto.sourceId);

    return this.prisma.$transaction(async (tx) => {
      const lastVersion = await tx.documentVersion.findFirst({
        where: { documentId: id },
        orderBy: { versionNumber: 'desc' },
      });

      await tx.documentVersion.create({
        data: {
          documentId: id,
          versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
          changedByUserId: actorUserId,
          changeSummary: dto.changeSummary,
          snapshot: current,
        },
      });

      return tx.document.update({
        where: { id },
        data: {
          title: dto.title,
          type: dto.type,
          description: dto.description,
          publicationDate: dto.publicationDate
            ? new Date(dto.publicationDate)
            : undefined,
          mediaAssetId: dto.mediaAssetId,
          sourceId: dto.sourceId,
        },
      });
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listVersions(id: string): Promise<DocumentVersion[]> {
    await this.findOne(id);
    return this.prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' },
    });
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

  private async assertSourceExists(id?: string): Promise<void> {
    if (!id) {
      return;
    }
    const source = await this.prisma.source.findUnique({ where: { id } });
    if (!source || source.deletedAt) {
      throw new BadRequestException('La fuente indicada no existe');
    }
  }
}
