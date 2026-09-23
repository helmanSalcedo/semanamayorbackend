import { NotFoundException } from '@nestjs/common';
import { PeopleService } from './people.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PeopleService', () => {
  let prisma: {
    person: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: PeopleService;

  beforeEach(() => {
    prisma = {
      person: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new PeopleService(prisma as unknown as PrismaService);
  });

  it('creates a person', async () => {
    prisma.person.create.mockResolvedValue({ id: 'p1' });
    await service.create({ displayName: 'Don José' });
    expect(prisma.person.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayName: 'Don José' }),
      }),
    );
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted person', async () => {
      prisma.person.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);

      prisma.person.findUnique.mockResolvedValue({
        id: 'x',
        deletedAt: new Date(),
      });
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing person', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 'p1', deletedAt: null });
      prisma.person.update.mockResolvedValue({});
      await service.remove('p1');
      expect(prisma.person.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
