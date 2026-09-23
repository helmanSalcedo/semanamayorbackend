import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ROLE_INCLUDE = {
  permissions: { include: { permission: true } },
} as const;

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { id: string; code: string }[];
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      include: ROLE_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return roles.map((r) => this.toResponse(r));
  }

  async findOne(id: string): Promise<RoleResponse> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE,
    });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    return this.toResponse(role);
  }

  async assignPermission(
    roleId: string,
    permissionId: string,
  ): Promise<RoleResponse> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }
    if (role.isSystem && role.code === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'SUPER_ADMIN ya tiene todos los permisos por diseño',
      );
    }
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new BadRequestException('El permiso indicado no existe');
    }

    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });

    return this.findOne(roleId);
  }

  async revokePermission(
    roleId: string,
    permissionId: string,
  ): Promise<RoleResponse> {
    await this.findOne(roleId);
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
    return this.findOne(roleId);
  }

  private toResponse(role: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: { permission: { id: string; code: string } }[];
  }): RoleResponse {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => ({
        id: p.permission.id,
        code: p.permission.code,
      })),
    };
  }
}
