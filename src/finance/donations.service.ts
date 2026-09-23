import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BeneficiaryType,
  Donation,
  DonationStatus,
  Prisma,
} from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { setAuditActor } from './audit-actor.util';
import { CreateDonationDto } from './dto/create-donation.dto';

const DONATION_INCLUDE = {
  allocations: true,
  statusHistory: true,
  receipt: true,
} as const;

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDonationDto): Promise<Donation> {
    if (dto.campaignId) {
      const campaign = await this.prisma.donationCampaign.findUnique({
        where: { id: dto.campaignId },
      });
      if (!campaign || campaign.deletedAt) {
        throw new BadRequestException('La campaña indicada no existe');
      }
    }

    if (dto.donorPersonId) {
      const donor = await this.prisma.person.findUnique({
        where: { id: dto.donorPersonId },
      });
      if (!donor || donor.deletedAt) {
        throw new BadRequestException(
          'El donante (persona) indicado no existe',
        );
      }
    }

    const allocatedCents = dto.allocations.reduce(
      (sum, a) => sum + toCents(a.amount),
      0,
    );
    if (allocatedCents !== toCents(dto.amount)) {
      throw new BadRequestException(
        `La suma de las asignaciones (${allocatedCents / 100}) debe ser igual al monto de la donación (${dto.amount})`,
      );
    }

    for (const allocation of dto.allocations) {
      await this.assertBeneficiaryExists(
        allocation.beneficiaryType,
        allocation.beneficiaryId,
      );
    }

    // No actor: this is the public donor-facing endpoint, no logged-in user.
    return this.prisma.$transaction(async (tx) => {
      return tx.donation.create({
        data: {
          campaignId: dto.campaignId,
          donorPersonId: dto.donorPersonId,
          donorNameSnapshot: dto.donorNameSnapshot,
          donorEmail: dto.donorEmail,
          donorVisibility: dto.donorVisibility,
          isAnonymous: dto.isAnonymous,
          amount: dto.amount,
          currency: dto.currency,
          notes: dto.notes,
          allocations: {
            create: dto.allocations.map((a) => ({
              beneficiaryType: a.beneficiaryType,
              beneficiaryId: a.beneficiaryId,
              amount: a.amount,
              percentage: a.percentage,
              notes: a.notes,
            })),
          },
        },
        include: DONATION_INCLUDE,
      });
    });
  }

  async findAll(
    pagination: PaginationDto,
    filters: { campaignId?: string; status?: DonationStatus },
  ): Promise<PaginatedResult<Donation>> {
    const where: Prisma.DonationWhereInput = {
      campaignId: filters.campaignId,
      status: filters.status,
    };
    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: DONATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.donation.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: DONATION_INCLUDE,
    });
    if (!donation) {
      throw new NotFoundException('Donación no encontrada');
    }
    return donation;
  }

  async confirm(
    id: string,
    actorUserId: string | undefined,
    reason?: string,
  ): Promise<Donation> {
    const donation = await this.requireStatus(
      id,
      DonationStatus.PENDING,
      'confirmar',
    );

    return this.prisma.$transaction(async (tx) => {
      await setAuditActor(tx, actorUserId);

      await tx.donation.update({
        where: { id },
        data: { status: DonationStatus.CONFIRMED },
      });
      await tx.donationStatusHistory.create({
        data: {
          donationId: id,
          fromStatus: donation.status,
          toStatus: DonationStatus.CONFIRMED,
          changedByUserId: actorUserId,
          reason,
        },
      });

      const existingReceipt = await tx.donationReceipt.findUnique({
        where: { donationId: id },
      });
      if (!existingReceipt) {
        await tx.donationReceipt.create({ data: { donationId: id } });
      }

      return tx.donation.findUniqueOrThrow({
        where: { id },
        include: DONATION_INCLUDE,
      });
    });
  }

  async refund(
    id: string,
    actorUserId: string | undefined,
    reason?: string,
  ): Promise<Donation> {
    const donation = await this.requireStatus(
      id,
      DonationStatus.CONFIRMED,
      'reembolsar',
    );
    return this.transitionStatus(
      id,
      donation.status,
      DonationStatus.REFUNDED,
      actorUserId,
      reason,
    );
  }

  async cancel(
    id: string,
    actorUserId: string | undefined,
    reason?: string,
  ): Promise<Donation> {
    const donation = await this.requireStatus(
      id,
      DonationStatus.PENDING,
      'cancelar',
    );
    return this.transitionStatus(
      id,
      donation.status,
      DonationStatus.CANCELLED,
      actorUserId,
      reason,
    );
  }

  /** Used by PaymentTransactionsService when a payment attempt fails. */
  async markFailedIfPending(
    id: string,
    actorUserId: string | undefined,
    reason?: string,
  ): Promise<void> {
    const donation = await this.prisma.donation.findUnique({ where: { id } });
    if (!donation || donation.status !== DonationStatus.PENDING) {
      return;
    }
    await this.transitionStatus(
      id,
      donation.status,
      DonationStatus.FAILED,
      actorUserId,
      reason,
    );
  }

  async getReceipt(id: string) {
    await this.findOne(id);
    const receipt = await this.prisma.donationReceipt.findUnique({
      where: { donationId: id },
    });
    if (!receipt) {
      throw new NotFoundException(
        'La donación todavía no tiene recibo (solo se emite al confirmarse)',
      );
    }
    return receipt;
  }

  private async requireStatus(
    id: string,
    expected: DonationStatus,
    actionLabel: string,
  ): Promise<Donation> {
    const donation = await this.prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      throw new NotFoundException('Donación no encontrada');
    }
    if (donation.status !== expected) {
      throw new BadRequestException(
        `No se puede ${actionLabel} una donación en estado ${donation.status} (se esperaba ${expected})`,
      );
    }
    return donation;
  }

  private async transitionStatus(
    id: string,
    fromStatus: DonationStatus,
    toStatus: DonationStatus,
    actorUserId: string | undefined,
    reason?: string,
  ): Promise<Donation> {
    return this.prisma.$transaction(async (tx) => {
      await setAuditActor(tx, actorUserId);
      await tx.donation.update({ where: { id }, data: { status: toStatus } });
      await tx.donationStatusHistory.create({
        data: {
          donationId: id,
          fromStatus,
          toStatus,
          changedByUserId: actorUserId,
          reason,
        },
      });
      return tx.donation.findUniqueOrThrow({
        where: { id },
        include: DONATION_INCLUDE,
      });
    });
  }

  private async assertBeneficiaryExists(
    type: BeneficiaryType,
    id?: string,
  ): Promise<void> {
    if (type === BeneficiaryType.JUNTA || type === BeneficiaryType.PROJECT) {
      return;
    }
    if (!id) {
      throw new BadRequestException(
        `beneficiaryId es requerido para beneficiaryType ${type}`,
      );
    }
    const exists = await this.beneficiaryExists(type, id);
    if (!exists) {
      throw new BadRequestException(
        `No existe ningún ${type} con id ${id} como beneficiario`,
      );
    }
  }

  private async beneficiaryExists(
    type: BeneficiaryType,
    id: string,
  ): Promise<boolean> {
    switch (type) {
      case BeneficiaryType.FESTIVAL:
        return (
          (await this.prisma.festival.findUnique({ where: { id } })) !== null
        );
      case BeneficiaryType.FESTIVAL_EDITION:
        return (
          (await this.prisma.festivalEdition.findUnique({ where: { id } })) !==
          null
        );
      case BeneficiaryType.PROCESSIONAL_STEP:
        return (
          (await this.prisma.processionalStep.findUnique({ where: { id } })) !==
          null
        );
      case BeneficiaryType.EVENT:
        return (await this.prisma.event.findUnique({ where: { id } })) !== null;
      default:
        return true;
    }
  }
}
