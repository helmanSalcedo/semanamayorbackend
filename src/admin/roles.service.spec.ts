import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesService', () => {
  let prisma: {
    role: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock };
    permission: { findUnique: jest.Mock };
    rolePermission: { upsert: jest.Mock; deleteMany: jest.Mock };
    auditLog: { create: jest.Mock };
  };
  let service: RolesService;

  beforeEach(() => {
    prisma = {
      role: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      permission: { findUnique: jest.fn() },
      rolePermission: { upsert: jest.fn(), deleteMany: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    service = new RolesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a non-system role', async () => {
      prisma.role.create.mockResolvedValue({
        id: 'r1',
        code: 'EDITOR',
        name: 'Editor',
        description: null,
        isSystem: false,
        permissions: [],
      });

      const result = await service.create({ code: 'EDITOR', name: 'Editor' });

      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'EDITOR', isSystem: false }),
        }),
      );
      expect(result.code).toBe('EDITOR');
    });
  });

  describe('findOne', () => {
    it('404s for a missing role', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermission', () => {
    it('refuses to touch SUPER_ADMIN (already has every permission by design)', async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 'r1',
        isSystem: true,
        code: 'SUPER_ADMIN',
      });
      await expect(service.assignPermission('r1', 'perm-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.rolePermission.upsert).not.toHaveBeenCalled();
    });

    it('rejects an unknown permissionId', async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 'r1',
        isSystem: true,
        code: 'HISTORIAN',
      });
      prisma.permission.findUnique.mockResolvedValue(null);
      await expect(service.assignPermission('r1', 'missing')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('upserts the role-permission link', async () => {
      prisma.role.findUnique
        .mockResolvedValueOnce({ id: 'r1', isSystem: true, code: 'HISTORIAN' })
        .mockResolvedValueOnce({
          id: 'r1',
          code: 'HISTORIAN',
          name: 'Historiador',
          description: null,
          isSystem: true,
          permissions: [],
        });
      prisma.permission.findUnique.mockResolvedValue({
        id: 'perm-1',
        code: 'source.manage',
      });
      prisma.rolePermission.upsert.mockResolvedValue({});

      await service.assignPermission('r1', 'perm-1');

      expect(prisma.rolePermission.upsert).toHaveBeenCalledWith({
        where: {
          roleId_permissionId: { roleId: 'r1', permissionId: 'perm-1' },
        },
        update: {},
        create: { roleId: 'r1', permissionId: 'perm-1' },
      });
    });
  });
});
