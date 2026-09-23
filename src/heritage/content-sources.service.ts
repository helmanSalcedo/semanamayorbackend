import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentSource, SourceableType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentSourceDto } from './dto/create-content-source.dto';

@Injectable()
export class ContentSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContentSourceDto): Promise<ContentSource> {
    const source = await this.prisma.source.findUnique({
      where: { id: dto.sourceId },
    });
    if (!source || source.deletedAt) {
      throw new BadRequestException('La fuente indicada no existe');
    }
    await this.assertSourceableExists(dto.sourceableType, dto.sourceableId);

    return this.prisma.contentSource.create({
      data: {
        sourceId: dto.sourceId,
        sourceableType: dto.sourceableType,
        sourceableId: dto.sourceableId,
        citationNote: dto.citationNote,
      },
    });
  }

  findBySourceable(
    sourceableType: SourceableType,
    sourceableId: string,
  ): Promise<ContentSource[]> {
    return this.prisma.contentSource.findMany({
      where: { sourceableType, sourceableId },
      include: { source: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string): Promise<void> {
    const citation = await this.prisma.contentSource.findUnique({
      where: { id },
    });
    if (!citation) {
      throw new NotFoundException('Cita de fuente no encontrada');
    }
    await this.prisma.contentSource.delete({ where: { id } });
  }

  /** Mirrors heritage.validate_content_source_sourceable at the app layer. */
  private async assertSourceableExists(
    type: SourceableType,
    id: string,
  ): Promise<void> {
    const exists = await this.sourceableExists(type, id);
    if (!exists) {
      throw new BadRequestException(
        `No existe ningún ${type} con id ${id} para citar`,
      );
    }
  }

  private async sourceableExists(
    type: SourceableType,
    id: string,
  ): Promise<boolean> {
    switch (type) {
      case SourceableType.HISTORICAL_EVENT:
        return (
          (await this.prisma.historicalEvent.findUnique({ where: { id } })) !==
          null
        );
      case SourceableType.PERSON:
        return (
          (await this.prisma.person.findUnique({ where: { id } })) !== null
        );
      case SourceableType.PROCESSIONAL_STEP:
        return (
          (await this.prisma.processionalStep.findUnique({ where: { id } })) !==
          null
        );
      case SourceableType.RELIGIOUS_IMAGE:
        return (
          (await this.prisma.religiousImage.findUnique({ where: { id } })) !==
          null
        );
      case SourceableType.EVENT:
        return (await this.prisma.event.findUnique({ where: { id } })) !== null;
      case SourceableType.RELIGIOUS_SITE:
        return (
          (await this.prisma.religiousSite.findUnique({ where: { id } })) !==
          null
        );
      case SourceableType.DOCUMENT:
        return (
          (await this.prisma.document.findUnique({ where: { id } })) !== null
        );
      case SourceableType.FAMILY:
        return (
          (await this.prisma.family.findUnique({ where: { id } })) !== null
        );
    }
  }
}
