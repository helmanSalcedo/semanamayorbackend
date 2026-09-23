import { NotFoundException } from '@nestjs/common';
import { BusinessSubscriptionStatus, SubscriptionPlan } from '@prisma/client';
import { BusinessSubscriptionsService } from './business-subscriptions.service';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BusinessSubscriptionsService', () => {
  let prisma: {
    businessSubscription: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let businessesService: { findOne: jest.Mock };
  let service: BusinessSubscriptionsService;

  beforeEach(() => {
    prisma = {
      businessSubscription: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    businessesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'biz-1' }),
    };
    service = new BusinessSubscriptionsService(
      prisma as unknown as PrismaService,
      businessesService as unknown as BusinessesService,
    );
  });

  describe('add', () => {
    it('creates the subscription once the business is verified', async () => {
      prisma.businessSubscription.create.mockResolvedValue({ id: 'sub-1' });
      await service.add('biz-1', {
        plan: SubscriptionPlan.PREMIUM,
        startDate: '2027-01-01',
      });
      expect(businessesService.findOne).toHaveBeenCalledWith('biz-1');
      expect(prisma.businessSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'biz-1',
            plan: SubscriptionPlan.PREMIUM,
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('404s when the subscription does not belong to the business', async () => {
      prisma.businessSubscription.findUnique.mockResolvedValue({
        id: 'sub-1',
        businessId: 'other-business',
      });
      await expect(
        service.updateStatus('biz-1', 'sub-1', {
          status: BusinessSubscriptionStatus.CANCELLED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
