import { NotFoundException } from '@nestjs/common';
import { SourceType } from '@prisma/client';
import { SourcesService } from './sources.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SourcesService', () => {
  let prisma: {
    source: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: SourcesService;

  beforeEach(() => {
    prisma = {
      source: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new SourcesService(prisma as unknown as PrismaService);
  });

  it('creates a source with the given type', async () => {
    prisma.source.create.mockResolvedValue({ id: 's1' });
    await service.create({
      title: 'Historia de Timbío',
      sourceType: SourceType.BOOK,
    });
    expect(prisma.source.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Historia de Timbío' }),
      }),
    );
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted source', async () => {
      prisma.source.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);

      prisma.source.findUnique.mockResolvedValue({
        id: 'x',
        deletedAt: new Date(),
      });
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing source', async () => {
      prisma.source.findUnique.mockResolvedValue({ id: 's1', deletedAt: null });
      prisma.source.update.mockResolvedValue({});
      await service.remove('s1');
      expect(prisma.source.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
