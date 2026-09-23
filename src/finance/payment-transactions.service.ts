import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentTransaction, PaymentTransactionStatus } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { setAuditActor } from './audit-actor.util';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { DonationsService } from './donations.service';

@Injectable()
export class PaymentTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly donationsService: DonationsService,
  ) {}

  /**
   * Records a payment attempt/result for a donation. In production this
   * would be called from a signed payment-gateway webhook, not a plain
   * authenticated endpoint — that verification isn't built yet (see README),
   * so for now this is gated behind a staff permission.
   */
  async create(
    donationId: string,
    dto: CreatePaymentTransactionDto,
    actorUserId: string | undefined,
  ): Promise<PaymentTransaction> {
    await this.donationsService.findOne(donationId);

    const provider = await this.prisma.paymentProvider.findUnique({
      where: { code: dto.providerCode },
    });
    if (!provider) {
      throw new BadRequestException(
        `No existe un PaymentProvider con código ${dto.providerCode}`,
      );
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      await setAuditActor(tx, actorUserId);
      return tx.paymentTransaction.create({
        data: {
          donationId,
          providerId: provider.id,
          externalTransactionId: dto.externalTransactionId,
          status: dto.status,
          amount: dto.amount,
          currency: dto.currency,
          paymentMethodType: dto.paymentMethodType,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
          metadata: dto.metadata as never,
        },
      });
    });

    await this.applyDonationSideEffect(donationId, dto.status, actorUserId);

    return transaction;
  }

  async findAllByDonation(
    donationId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<PaymentTransaction>> {
    await this.donationsService.findOne(donationId);
    const where = { donationId };
    const [data, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(
    donationId: string,
    transactionId: string,
  ): Promise<PaymentTransaction> {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction || transaction.donationId !== donationId) {
      throw new NotFoundException('Transacción de pago no encontrada');
    }
    return transaction;
  }

  private async applyDonationSideEffect(
    donationId: string,
    status: PaymentTransactionStatus,
    actorUserId: string | undefined,
  ): Promise<void> {
    switch (status) {
      case PaymentTransactionStatus.SUCCEEDED:
        await this.donationsService.confirm(
          donationId,
          actorUserId,
          'Pago confirmado por el proveedor',
        );
        break;
      case PaymentTransactionStatus.FAILED:
        await this.donationsService.markFailedIfPending(
          donationId,
          actorUserId,
          'Pago fallido reportado por el proveedor',
        );
        break;
      case PaymentTransactionStatus.REFUNDED:
        await this.donationsService.refund(
          donationId,
          actorUserId,
          'Reembolso reportado por el proveedor',
        );
        break;
      case PaymentTransactionStatus.PENDING:
        break;
    }
  }
}
