import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancialCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinancialCategoryDto } from './dto/create-financial-category.dto';
import { UpdateFinancialCategoryDto } from './dto/update-financial-category.dto';

@Injectable()
export class FinancialCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFinancialCategoryDto): Promise<FinancialCategory> {
    await this.assertParentExists(dto.parentId);
    return this.prisma.financialCategory.create({
      data: { name: dto.name, type: dto.type, parentId: dto.parentId },
    });
  }

  findAll(): Promise<FinancialCategory[]> {
    return this.prisma.financialCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string): Promise<FinancialCategory> {
    const category = await this.prisma.financialCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Categoría financiera no encontrada');
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateFinancialCategoryDto,
  ): Promise<FinancialCategory> {
    await this.findOne(id);
    await this.assertParentExists(dto.parentId);
    return this.prisma.financialCategory.update({
      where: { id },
      data: { name: dto.name, type: dto.type, parentId: dto.parentId },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    // Fails with 409 (FK restrict) if any FinancialTransaction still
    // references this category — intentional, matches the ledger's
    // never-lose-history design.
    await this.prisma.financialCategory.delete({ where: { id } });
  }

  private async assertParentExists(parentId?: string): Promise<void> {
    if (!parentId) return;
    const parent = await this.prisma.financialCategory.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new BadRequestException('La categoría padre indicada no existe');
    }
  }
}
