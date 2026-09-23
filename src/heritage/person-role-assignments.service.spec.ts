import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleSubjectType } from '@prisma/client';
import { PersonRoleAssignmentsService } from './person-role-assignments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PersonRoleAssignmentsService', () => {
  let prisma: {
    person: { findUnique: jest.Mock };
    roleType: { findUnique: jest.Mock };
    source: { findUnique: jest.Mock };
    personRoleAssignment: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    processionalStep: { findUnique: jest.Mock };
    festival: { findUnique: jest.Mock };
  };
  let service: PersonRoleAssignmentsService;

  beforeEach(() => {
    prisma = {
      person: { findUnique: jest.fn() },
      roleType: { findUnique: jest.fn() },
      source: { findUnique: jest.fn() },
      personRoleAssignment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      processionalStep: { findUnique: jest.fn() },
      festival: { findUnique: jest.fn() },
    };
    service = new PersonRoleAssignmentsService(
      prisma as unknown as PrismaService,
    );
  });

  describe('create', () => {
    const baseDto = {
      personId: 'person-1',
      roleTypeId: 'role-1',
      subjectType: RoleSubjectType.PROCESSIONAL_STEP,
      subjectId: 'step-1',
    };

    it('rejects an unknown person', async () => {
      prisma.person.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.personRoleAssignment.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown role type', async () => {
      prisma.person.findUnique.mockResolvedValue({
        id: 'person-1',
        deletedAt: null,
      });
      prisma.roleType.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a subject that does not exist for that type', async () => {
      prisma.person.findUnique.mockResolvedValue({
        id: 'person-1',
        deletedAt: null,
      });
      prisma.roleType.findUnique.mockResolvedValue({ id: 'role-1' });
      prisma.processionalStep.findUnique.mockResolvedValue(null);

      await expect(service.create(baseDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.personRoleAssignment.create).not.toHaveBeenCalled();
    });

    it('creates the assignment when everything exists', async () => {
      prisma.person.findUnique.mockResolvedValue({
        id: 'person-1',
        deletedAt: null,
      });
      prisma.roleType.findUnique.mockResolvedValue({ id: 'role-1' });
      prisma.processionalStep.findUnique.mockResolvedValue({ id: 'step-1' });
      prisma.personRoleAssignment.create.mockResolvedValue({ id: 'pra-1' });

      await service.create(baseDto);

      expect(prisma.personRoleAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          personId: 'person-1',
          roleTypeId: 'role-1',
          subjectType: RoleSubjectType.PROCESSIONAL_STEP,
          subjectId: 'step-1',
        }),
      });
    });
  });

  describe('find', () => {
    it('requires personId or subjectType+subjectId', () => {
      expect(() => service.find({})).toThrow(BadRequestException);
    });

    it('filters by personId alone', async () => {
      prisma.personRoleAssignment.findMany.mockResolvedValue([]);
      await service.find({ personId: 'person-1' });
      expect(prisma.personRoleAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { personId: 'person-1' } }),
      );
    });
  });

  describe('remove', () => {
    it('404s when the assignment does not exist', async () => {
      prisma.personRoleAssignment.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
