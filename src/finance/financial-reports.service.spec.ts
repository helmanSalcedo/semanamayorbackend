import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FinancialReportsService } from './financial-reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinancialReportsService', () => {
  let prisma: {
    donationCampaign: { findUnique: jest.Mock };
    financialTransaction: { aggregate: jest.Mock };
    financialReport: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let service: FinancialReportsService;

  beforeEach(() => {
    prisma = {
      donationCampaign: { findUnique: jest.fn() },
      financialTransaction: { aggregate: jest.fn() },
      financialReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new FinancialReportsService(prisma as unknown as PrismaService);
  });

  describe('generate', () => {
    it('rejects periodStart after periodEnd', async () => {
      await expect(
        service.generate(
          { periodStart: '2027-05-01', periodEnd: '2027-01-01' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.financialReport.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown campaignId', async () => {
      prisma.donationCampaign.findUnique.mockResolvedValue(null);
      await expect(
        service.generate(
          {
            campaignId: 'missing',
            periodStart: '2027-01-01',
            periodEnd: '2027-05-01',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('sums income and expense transactions for the period', async () => {
      prisma.financialTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 500000 } }) // income
        .mockResolvedValueOnce({ _sum: { amount: 200000 } }); // expense
      prisma.financialReport.create.mockResolvedValue({ id: 'report-1' });

      await service.generate(
        { periodStart: '2027-01-01', periodEnd: '2027-05-01' },
        'user-1',
      );

      expect(prisma.financialReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalIncome: 500000,
          totalExpense: 200000,
          generatedByUserId: 'user-1',
        }),
      });
    });

    it('defaults totals to 0 when there are no transactions in the period', async () => {
      prisma.financialTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });
      prisma.financialReport.create.mockResolvedValue({});

      await service.generate(
        { periodStart: '2027-01-01', periodEnd: '2027-05-01' },
        'user-1',
      );

      expect(prisma.financialReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalIncome: 0, totalExpense: 0 }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('404s for a missing report', async () => {
      prisma.financialReport.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });
});
