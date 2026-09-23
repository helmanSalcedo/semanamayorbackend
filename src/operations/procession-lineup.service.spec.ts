import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcessionLineupService } from './procession-lineup.service';
import { ProcessionsService } from './processions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProcessionLineupService', () => {
  let prisma: {
    processionalStep: { findUnique: jest.Mock };
    processionStep: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let processionsService: { findOne: jest.Mock };
  let service: ProcessionLineupService;

  beforeEach(() => {
    prisma = {
      processionalStep: { findUnique: jest.fn() },
      processionStep: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    processionsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'procession-1' }),
    };
    service = new ProcessionLineupService(
      prisma as unknown as PrismaService,
      processionsService as unknown as ProcessionsService,
    );
  });

  describe('add', () => {
    it('rejects a processionalStepId that does not belong to this festival', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({
        id: 'step-1',
        festivalId: 'other-festival',
        deletedAt: null,
      });
      await expect(
        service.add('festival-1', 'edition-1', 'procession-1', {
          processionalStepId: 'step-1',
          order: 1,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.processionStep.create).not.toHaveBeenCalled();
    });

    it('adds the step to the lineup', async () => {
      prisma.processionalStep.findUnique.mockResolvedValue({
        id: 'step-1',
        festivalId: 'festival-1',
        deletedAt: null,
      });
      prisma.processionStep.create.mockResolvedValue({});

      await service.add('festival-1', 'edition-1', 'procession-1', {
        processionalStepId: 'step-1',
        order: 1,
      });

      expect(prisma.processionStep.create).toHaveBeenCalledWith({
        data: {
          processionId: 'procession-1',
          processionalStepId: 'step-1',
          order: 1,
          estimatedDurationMinutes: undefined,
          notes: undefined,
        },
      });
    });
  });

  describe('remove', () => {
    it('404s when the item belongs to a different procession', async () => {
      prisma.processionStep.findUnique.mockResolvedValue({
        id: 'ps-1',
        processionId: 'other',
      });
      await expect(
        service.remove('festival-1', 'edition-1', 'procession-1', 'ps-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
