import { NotFoundException } from '@nestjs/common';
import { BusinessContactType } from '@prisma/client';
import { BusinessContactsService } from './business-contacts.service';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BusinessContactsService', () => {
  let prisma: {
    businessContact: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let businessesService: { findOne: jest.Mock };
  let service: BusinessContactsService;

  beforeEach(() => {
    prisma = {
      businessContact: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    businessesService = {
      findOne: jest.fn().mockResolvedValue({ id: 'biz-1' }),
    };
    service = new BusinessContactsService(
      prisma as unknown as PrismaService,
      businessesService as unknown as BusinessesService,
    );
  });

  describe('add', () => {
    it('creates the contact once the business is verified', async () => {
      prisma.businessContact.create.mockResolvedValue({ id: 'contact-1' });
      await service.add('biz-1', {
        type: BusinessContactType.WHATSAPP,
        value: '+573000000000',
      });
      expect(businessesService.findOne).toHaveBeenCalledWith('biz-1');
      expect(prisma.businessContact.create).toHaveBeenCalledWith({
        data: {
          businessId: 'biz-1',
          type: BusinessContactType.WHATSAPP,
          value: '+573000000000',
        },
      });
    });
  });

  describe('remove', () => {
    it('404s when the contact does not belong to the business', async () => {
      prisma.businessContact.findUnique.mockResolvedValue({
        id: 'contact-1',
        businessId: 'other-business',
      });
      await expect(service.remove('biz-1', 'contact-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
