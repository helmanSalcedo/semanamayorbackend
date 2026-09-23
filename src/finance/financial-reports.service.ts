import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancialCategoryType, FinancialReport } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateFinancialReportDto } from './dto/generate-financial-report.dto';

@Injectable()
export class FinancialReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A fixed snapshot "as of" a period, not a live view: transparency
   * reports must not silently change after publication just because new
   * donations arrived later (see docs/database/FINANCIAL_MODEL.md).
   */
  async generate(
    dto: GenerateFinancialReportDto,
    generatedByUserId: string | undefined,
  ): Promise<FinancialReport> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodStart > periodEnd) {
      throw new BadRequestException(
        'periodStart no puede ser posterior a periodEnd',
      );
    }
    if (dto.campaignId) {
      const campaign = await this.prisma.donationCampaign.findUnique({
        where: { id: dto.campaignId },
      });
      if (!campaign || campaign.deletedAt) {
        throw new BadRequestException('La campaña indicada no existe');
      }
    }

    const where = {
      occurredAt: { gte: periodStart, lte: periodEnd },
      relatedCampaignId: dto.campaignId,
    };

    const [incomeSum, expenseSum] = await Promise.all([
      this.prisma.financialTransaction.aggregate({
        where: { ...where, type: FinancialCategoryType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.financialTransaction.aggregate({
        where: { ...where, type: FinancialCategoryType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    return this.prisma.financialReport.create({
      data: {
        campaignId: dto.campaignId,
        periodStart,
        periodEnd,
        totalIncome: incomeSum._sum.amount ?? 0,
        totalExpense: expenseSum._sum.amount ?? 0,
        generatedByUserId,
      },
    });
  }

  async findAll(
    pagination: PaginationDto,
    campaignId?: string,
  ): Promise<PaginatedResult<FinancialReport>> {
    const where = { campaignId };
    const [data, total] = await Promise.all([
      this.prisma.financialReport.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.financialReport.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<FinancialReport> {
    const report = await this.prisma.financialReport.findUnique({
      where: { id },
    });
    if (!report) {
      throw new NotFoundException('Reporte financiero no encontrado');
    }
    return report;
  }
}
