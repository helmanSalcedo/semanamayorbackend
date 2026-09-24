import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FamilyPerson, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddFamilyMemberDto } from './dto/add-family-member.dto';
import { FamiliesService } from './families.service';

@Injectable()
export class FamilyMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly familiesService: FamiliesService,
  ) {}

  async add(familyId: string, dto: AddFamilyMemberDto): Promise<FamilyPerson> {
    await this.familiesService.findOne(familyId);
    await this.assertPersonExists(dto.personId);
    await this.assertSourceExists(dto.sourceId);

    try {
      return await this.prisma.familyPerson.create({
        data: {
          familyId,
          personId: dto.personId,
          relationshipNote: dto.relationshipNote,
          sourceId: dto.sourceId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Esta persona ya pertenece a la familia');
      }
      throw error;
    }
  }

  async findAll(familyId: string): Promise<FamilyPerson[]> {
    await this.familiesService.findOne(familyId);
    return this.prisma.familyPerson.findMany({
      where: { familyId },
      include: { person: true },
    });
  }

  async remove(familyId: string, memberId: string): Promise<void> {
    await this.familiesService.findOne(familyId);
    const member = await this.prisma.familyPerson.findUnique({
      where: { id: memberId },
    });
    if (!member || member.familyId !== familyId) {
      throw new NotFoundException('Vínculo familiar no encontrado');
    }
    await this.prisma.familyPerson.delete({ where: { id: memberId } });
  }

  private async assertPersonExists(personId: string): Promise<void> {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
    });
    if (!person || person.deletedAt) {
      throw new BadRequestException('La persona indicada no existe');
    }
  }

  private async assertSourceExists(sourceId?: string): Promise<void> {
    if (!sourceId) return;
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
    });
    if (!source) {
      throw new BadRequestException('La fuente indicada no existe');
    }
  }
}
