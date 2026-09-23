import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentRights, RightsSubjectType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentRightsDto } from './dto/create-content-rights.dto';
import { UpdateContentRightsDto } from './dto/update-content-rights.dto';

@Injectable()
export class ContentRightsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContentRightsDto): Promise<ContentRights> {
    await this.assertSubjectExists(dto.subjectType, dto.subjectId);

    return this.prisma.contentRights.create({
      data: {
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        owner: dto.owner,
        custodian: dto.custodian,
        rightsType: dto.rightsType,
        license: dto.license,
        permissionStatus: dto.permissionStatus,
        permissionGrantedAt: dto.permissionGrantedAt
          ? new Date(dto.permissionGrantedAt)
          : undefined,
        sourceText: dto.sourceText,
        restrictionsNote: dto.restrictionsNote,
        notes: dto.notes,
      },
    });
  }

  findBySubject(
    subjectType: RightsSubjectType,
    subjectId: string,
  ): Promise<ContentRights[]> {
    return this.prisma.contentRights.findMany({
      where: { subjectType, subjectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<ContentRights> {
    const rights = await this.prisma.contentRights.findUnique({
      where: { id },
    });
    if (!rights) {
      throw new NotFoundException('Registro de derechos no encontrado');
    }
    return rights;
  }

  async update(
    id: string,
    dto: UpdateContentRightsDto,
  ): Promise<ContentRights> {
    await this.findOne(id);
    if (dto.subjectType && dto.subjectId) {
      await this.assertSubjectExists(dto.subjectType, dto.subjectId);
    }

    return this.prisma.contentRights.update({
      where: { id },
      data: {
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        owner: dto.owner,
        custodian: dto.custodian,
        rightsType: dto.rightsType,
        license: dto.license,
        permissionStatus: dto.permissionStatus,
        permissionGrantedAt: dto.permissionGrantedAt
          ? new Date(dto.permissionGrantedAt)
          : undefined,
        sourceText: dto.sourceText,
        restrictionsNote: dto.restrictionsNote,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.contentRights.delete({ where: { id } });
  }

  /** Mirrors heritage.validate_content_rights_subject at the app layer. */
  private async assertSubjectExists(
    type: RightsSubjectType,
    id: string,
  ): Promise<void> {
    const exists = await this.subjectExists(type, id);
    if (!exists) {
      throw new BadRequestException(`No existe ningún ${type} con id ${id}`);
    }
  }

  private async subjectExists(
    type: RightsSubjectType,
    id: string,
  ): Promise<boolean> {
    switch (type) {
      case RightsSubjectType.MEDIA_ASSET:
        return (
          (await this.prisma.mediaAsset.findUnique({ where: { id } })) !== null
        );
      case RightsSubjectType.PROCESSIONAL_STEP:
        return (
          (await this.prisma.processionalStep.findUnique({ where: { id } })) !==
          null
        );
      case RightsSubjectType.RELIGIOUS_IMAGE:
        return (
          (await this.prisma.religiousImage.findUnique({ where: { id } })) !==
          null
        );
      case RightsSubjectType.DOCUMENT:
        return (
          (await this.prisma.document.findUnique({ where: { id } })) !== null
        );
    }
  }
}
