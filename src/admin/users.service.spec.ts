import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    email: 'persona@example.com',
    fullName: 'Persona Ejemplo',
    passwordHash: 'super-secret-hash',
    phone: null,
    isActive: true,
    emailVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date(),
    deletedAt: null,
    roles: [{ role: { id: 'role-1', code: 'VIEWER', name: 'Visualizador' } }],
    ...overrides,
  };
}

describe('UsersService', () => {
  let prisma: {
    user: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    role: { findUnique: jest.Mock };
    userRole: { upsert: jest.Mock; deleteMany: jest.Mock };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      role: { findUnique: jest.fn() },
      userRole: { upsert: jest.fn(), deleteMany: jest.fn() },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('never leaks passwordHash in the response', async () => {
      prisma.user.findMany.mockResolvedValue([buildUser()]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        skip: 0,
      });

      expect(result.data[0]).not.toHaveProperty('passwordHash');
      expect(result.data[0].roles).toEqual([
        { id: 'role-1', code: 'VIEWER', name: 'Visualizador' },
      ]);
    });
  });

  describe('findOne', () => {
    it('404s for a missing or soft-deleted user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);

      prisma.user.findUnique.mockResolvedValue(
        buildUser({ deletedAt: new Date() }),
      );
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRole', () => {
    it('rejects an unknown roleId', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(
        service.assignRole('user-1', 'missing-role', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.userRole.upsert).not.toHaveBeenCalled();
    });

    it('upserts the role assignment (idempotent, no error on repeat)', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.role.findUnique.mockResolvedValue({
        id: 'role-2',
        code: 'HISTORIAN',
      });
      prisma.userRole.upsert.mockResolvedValue({});

      await service.assignRole('user-1', 'role-2', 'admin-1');

      expect(prisma.userRole.upsert).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-2' } },
        update: {},
        create: {
          userId: 'user-1',
          roleId: 'role-2',
          assignedByUserId: 'admin-1',
        },
      });
    });
  });

  describe('revokeRole', () => {
    it('deletes the user-role link', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.userRole.deleteMany.mockResolvedValue({ count: 1 });

      await service.revokeRole('user-1', 'role-1');

      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', roleId: 'role-1' },
      });
    });
  });
});
