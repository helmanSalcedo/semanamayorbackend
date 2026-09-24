import { Injectable, NotFoundException } from '@nestjs/common';
import { Family } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamiliesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFamilyDto): Promise<Family> {
    return this.prisma.family.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Family>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.family.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.family.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Family> {
    const family = await this.prisma.family.findUnique({ where: { id } });
    if (!family || family.deletedAt) {
      throw new NotFoundException('Familia no encontrada');
    }
    return family;
  }

  async update(id: string, dto: UpdateFamilyDto): Promise<Family> {
    await this.findOne(id);
    return this.prisma.family.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.family.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
