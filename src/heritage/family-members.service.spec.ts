import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FamilyMembersService } from './family-members.service';
import { FamiliesService } from './families.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FamilyMembersService', () => {
  let prisma: {
    familyPerson: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    person: { findUnique: jest.Mock };
    source: { findUnique: jest.Mock };
  };
  let familiesService: { findOne: jest.Mock };
  let service: FamilyMembersService;

  beforeEach(() => {
    prisma = {
      familyPerson: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      person: { findUnique: jest.fn() },
      source: { findUnique: jest.fn() },
    };
    familiesService = { findOne: jest.fn().mockResolvedValue({ id: 'fam-1' }) };
    service = new FamilyMembersService(
      prisma as unknown as PrismaService,
      familiesService as unknown as FamiliesService,
    );
  });

  describe('add', () => {
    it('rejects an unknown personId', async () => {
      prisma.person.findUnique.mockResolvedValue(null);
      await expect(
        service.add('fam-1', { personId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.familyPerson.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown sourceId', async () => {
      prisma.person.findUnique.mockResolvedValue({
        id: 'person-1',
        deletedAt: null,
      });
      prisma.source.findUnique.mockResolvedValue(null);
      await expect(
        service.add('fam-1', { personId: 'person-1', sourceId: 'missing' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.familyPerson.create).not.toHaveBeenCalled();
    });

    it('allows creating the link without a sourceId (draft genealogy)', async () => {
      prisma.person.findUnique.mockResolvedValue({
        id: 'person-1',
        deletedAt: null,
      });
      prisma.familyPerson.create.mockResolvedValue({ id: 'fp-1' });

      await service.add('fam-1', { personId: 'person-1' });

      expect(prisma.familyPerson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            familyId: 'fam-1',
            personId: 'person-1',
            sourceId: undefined,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('404s when the member does not belong to the family', async () => {
      prisma.familyPerson.findUnique.mockResolvedValue({
        id: 'fp-1',
        familyId: 'other-family',
      });
      await expect(service.remove('fam-1', 'fp-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
