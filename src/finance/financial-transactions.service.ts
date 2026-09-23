import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FinancialCategoryType,
  FinancialTransaction,
  Prisma,
} from '@prisma/client';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { setAuditActor } from './audit-actor.util';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { FindFinancialTransactionsDto } from './dto/find-financial-transactions.dto';
import { ReverseFinancialTransactionDto } from './dto/reverse-financial-transaction.dto';

function flip(type: FinancialCategoryType): FinancialCategoryType {
  return type === FinancialCategoryType.INCOME
    ? FinancialCategoryType.EXPENSE
    : FinancialCategoryType.INCOME;
}

@Injectable()
export class FinancialTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFinancialTransactionDto,
    actorUserId: string | undefined,
  ): Promise<FinancialTransaction> {
    const category = await this.prisma.financialCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        'La categoría financiera indicada no existe',
      );
    }
    await this.assertDonationExists(dto.relatedDonationId);
    await this.assertCampaignExists(dto.relatedCampaignId);

    return this.prisma.$transaction(async (tx) => {
      await setAuditActor(tx, actorUserId);
      return tx.financialTransaction.create({
        data: {
          categoryId: dto.categoryId,
          type: dto.type,
          amount: dto.amount,
          currency: dto.currency,
          description: dto.description,
          relatedDonationId: dto.relatedDonationId,
          relatedCampaignId: dto.relatedCampaignId,
          occurredAt: new Date(dto.occurredAt),
          createdByUserId: actorUserId,
        },
      });
    });
  }

  async findAll(
    query: FindFinancialTransactionsDto,
  ): Promise<PaginatedResult<FinancialTransaction>> {
    const where: Prisma.FinancialTransactionWhereInput = {
      categoryId: query.categoryId,
      type: query.type,
      relatedCampaignId: query.relatedCampaignId,
    };
    const [data, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);
    return paginate(data, total, query);
  }

  async findOne(id: string): Promise<FinancialTransaction> {
    const transaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException('Transacción financiera no encontrada');
    }
    return transaction;
  }

  /**
   * The ledger is append-only (enforced by a DB trigger): a "correction" is
   * never an UPDATE, it's a new entry with the opposite type and the same
   * amount, cross-referenced via reversalOfTransactionId.
   */
  async reverse(
    id: string,
    dto: ReverseFinancialTransactionDto,
    actorUserId: string | undefined,
  ): Promise<FinancialTransaction> {
    const original = await this.findOne(id);

    const alreadyReversed = await this.prisma.financialTransaction.findFirst({
      where: { reversalOfTransactionId: id },
    });
    if (alreadyReversed) {
      throw new BadRequestException(
        'Esta transacción ya tiene una reversa registrada',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await setAuditActor(tx, actorUserId);
      return tx.financialTransaction.create({
        data: {
          categoryId: original.categoryId,
          type: flip(original.type),
          amount: original.amount,
          currency: original.currency,
          description: dto.description ?? `Reversa de la transacción ${id}`,
          relatedDonationId: original.relatedDonationId,
          relatedCampaignId: original.relatedCampaignId,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          createdByUserId: actorUserId,
          reversalOfTransactionId: id,
        },
      });
    });
  }

  private async assertDonationExists(id?: string): Promise<void> {
    if (!id) return;
    const donation = await this.prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      throw new BadRequestException(
        'La donación relacionada indicada no existe',
      );
    }
  }

  private async assertCampaignExists(id?: string): Promise<void> {
    if (!id) return;
    const campaign = await this.prisma.donationCampaign.findUnique({
      where: { id },
    });
    if (!campaign || campaign.deletedAt) {
      throw new BadRequestException(
        'La campaña relacionada indicada no existe',
      );
    }
  }
}
