import { NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TagsService', () => {
  let prisma: {
    tag: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: TagsService;

  beforeEach(() => {
    prisma = {
      tag: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new TagsService(prisma as unknown as PrismaService);
  });

  it('derives the slug from the name', async () => {
    prisma.tag.create.mockResolvedValue({});
    await service.create({ name: 'Cultura' });
    expect(prisma.tag.create).toHaveBeenCalledWith({
      data: { name: 'Cultura', slug: 'cultura' },
    });
  });

  describe('remove', () => {
    it('404s for a missing tag', async () => {
      prisma.tag.findUnique.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toThrow(NotFoundException);
    });
  });
});
