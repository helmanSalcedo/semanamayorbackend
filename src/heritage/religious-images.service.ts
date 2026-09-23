import { Injectable, NotFoundException } from '@nestjs/common';
import { ReligiousImage } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessionalStepsService } from './processional-steps.service';
import { CreateReligiousImageDto } from './dto/create-religious-image.dto';
import { UpdateReligiousImageDto } from './dto/update-religious-image.dto';

@Injectable()
export class ReligiousImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stepsService: ProcessionalStepsService,
  ) {}

  async create(
    festivalId: string,
    stepId: string,
    dto: CreateReligiousImageDto,
  ): Promise<ReligiousImage> {
    await this.stepsService.findOne(festivalId, stepId); // 404s if missing/wrong festival

    return this.prisma.religiousImage.create({
      data: { processionalStepId: stepId, ...dto },
    });
  }

  async findAllByStep(
    festivalId: string,
    stepId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<ReligiousImage>> {
    await this.stepsService.findOne(festivalId, stepId);
    const where = { processionalStepId: stepId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.religiousImage.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.religiousImage.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(
    festivalId: string,
    stepId: string,
    imageId: string,
  ): Promise<ReligiousImage> {
    await this.stepsService.findOne(festivalId, stepId);
    const image = await this.prisma.religiousImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.processionalStepId !== stepId || image.deletedAt) {
      throw new NotFoundException('Imagen religiosa no encontrada');
    }
    return image;
  }

  async update(
    festivalId: string,
    stepId: string,
    imageId: string,
    dto: UpdateReligiousImageDto,
  ): Promise<ReligiousImage> {
    await this.findOne(festivalId, stepId, imageId);
    return this.prisma.religiousImage.update({
      where: { id: imageId },
      data: dto,
    });
  }

  async remove(
    festivalId: string,
    stepId: string,
    imageId: string,
  ): Promise<void> {
    await this.findOne(festivalId, stepId, imageId);
    await this.prisma.religiousImage.update({
      where: { id: imageId },
      data: { deletedAt: new Date() },
    });
  }
}
