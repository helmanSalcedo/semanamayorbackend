import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessSubscription } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from './businesses.service';
import { CreateBusinessSubscriptionDto } from './dto/create-business-subscription.dto';
import { UpdateBusinessSubscriptionStatusDto } from './dto/update-business-subscription-status.dto';

@Injectable()
export class BusinessSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async add(
    businessId: string,
    dto: CreateBusinessSubscriptionDto,
  ): Promise<BusinessSubscription> {
    await this.businessesService.findOne(businessId);
    return this.prisma.businessSubscription.create({
      data: {
        businessId,
        plan: dto.plan,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAll(businessId: string): Promise<BusinessSubscription[]> {
    await this.businessesService.findOne(businessId);
    return this.prisma.businessSubscription.findMany({
      where: { businessId },
      orderBy: { startDate: 'desc' },
    });
  }

  async updateStatus(
    businessId: string,
    subscriptionId: string,
    dto: UpdateBusinessSubscriptionStatusDto,
  ): Promise<BusinessSubscription> {
    await this.businessesService.findOne(businessId);
    const subscription = await this.prisma.businessSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription || subscription.businessId !== businessId) {
      throw new NotFoundException('Suscripción no encontrada');
    }
    return this.prisma.businessSubscription.update({
      where: { id: subscriptionId },
      data: { status: dto.status },
    });
  }
}
