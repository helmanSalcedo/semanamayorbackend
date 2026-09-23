import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PersonRoleAssignment, Prisma, RoleSubjectType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonRoleAssignmentDto } from './dto/create-person-role-assignment.dto';
import { FindPersonRoleAssignmentsDto } from './dto/find-person-role-assignments.dto';

@Injectable()
export class PersonRoleAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreatePersonRoleAssignmentDto,
  ): Promise<PersonRoleAssignment> {
    const person = await this.prisma.person.findUnique({
      where: { id: dto.personId },
    });
    if (!person || person.deletedAt) {
      throw new BadRequestException('La persona indicada no existe');
    }

    const roleType = await this.prisma.roleType.findUnique({
      where: { id: dto.roleTypeId },
    });
    if (!roleType) {
      throw new BadRequestException('El tipo de rol indicado no existe');
    }

    if (dto.sourceId) {
      const source = await this.prisma.source.findUnique({
        where: { id: dto.sourceId },
      });
      if (!source || source.deletedAt) {
        throw new BadRequestException('La fuente indicada no existe');
      }
    }

    await this.assertSubjectExists(dto.subjectType, dto.subjectId);

    return this.prisma.personRoleAssignment.create({
      data: {
        personId: dto.personId,
        roleTypeId: dto.roleTypeId,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        sourceId: dto.sourceId,
      },
    });
  }

  find(query: FindPersonRoleAssignmentsDto): Promise<PersonRoleAssignment[]> {
    if (!query.personId && !(query.subjectType && query.subjectId)) {
      throw new BadRequestException(
        'Indicá personId o subjectType+subjectId para filtrar los roles',
      );
    }

    const where: Prisma.PersonRoleAssignmentWhereInput = {};
    if (query.personId) {
      where.personId = query.personId;
    }
    if (query.subjectType && query.subjectId) {
      where.subjectType = query.subjectType;
      where.subjectId = query.subjectId;
    }

    return this.prisma.personRoleAssignment.findMany({
      where,
      include: { person: true, roleType: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.prisma.personRoleAssignment.findUnique({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException('Asignación de rol no encontrada');
    }
    await this.prisma.personRoleAssignment.delete({ where: { id } });
  }

  /** Mirrors heritage.validate_person_role_assignment_subject at the app layer. */
  private async assertSubjectExists(
    type: RoleSubjectType,
    id: string,
  ): Promise<void> {
    const exists = await this.subjectExists(type, id);
    if (!exists) {
      throw new BadRequestException(
        `No existe ningún ${type} con id ${id} para asignar el rol`,
      );
    }
  }

  private async subjectExists(
    type: RoleSubjectType,
    id: string,
  ): Promise<boolean> {
    switch (type) {
      case RoleSubjectType.PROCESSIONAL_STEP:
        return (
          (await this.prisma.processionalStep.findUnique({ where: { id } })) !==
          null
        );
      case RoleSubjectType.FESTIVAL:
        return (
          (await this.prisma.festival.findUnique({ where: { id } })) !== null
        );
      case RoleSubjectType.FESTIVAL_EDITION:
        return (
          (await this.prisma.festivalEdition.findUnique({ where: { id } })) !==
          null
        );
      case RoleSubjectType.EVENT:
        return (await this.prisma.event.findUnique({ where: { id } })) !== null;
      case RoleSubjectType.HISTORICAL_EVENT:
        return (
          (await this.prisma.historicalEvent.findUnique({ where: { id } })) !==
          null
        );
      case RoleSubjectType.RELIGIOUS_SITE:
        return (
          (await this.prisma.religiousSite.findUnique({ where: { id } })) !==
          null
        );
    }
  }
}
