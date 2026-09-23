import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult, paginate } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_INCLUDE = { roles: { include: { role: true } } } as const;

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: { id: string; code: string; name: string }[];
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindUsersDto): Promise<PaginatedResult<UserResponse>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      isActive: query.isActive,
      roles: query.roleCode
        ? { some: { role: { code: query.roleCode } } }
        : undefined,
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(
      users.map((u) => this.toResponse(u)),
      total,
      query,
    );
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        isActive: dto.isActive,
      },
      include: USER_INCLUDE,
    });
    return this.toResponse(user);
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedByUserId: string,
  ): Promise<UserResponse> {
    await this.findOne(userId);
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException('El rol indicado no existe');
    }

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId, assignedByUserId },
    });

    return this.findOne(userId);
  }

  async revokeRole(userId: string, roleId: string): Promise<UserResponse> {
    await this.findOne(userId);
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return this.findOne(userId);
  }

  private toResponse(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    roles: { role: { id: string; code: string; name: string } }[];
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.roles.map((r) => ({
        id: r.role.id,
        code: r.role.code,
        name: r.role.name,
      })),
    };
  }
}
