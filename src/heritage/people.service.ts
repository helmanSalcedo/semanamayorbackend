import { Injectable, NotFoundException } from '@nestjs/common';
import { Person } from '@prisma/client';
import {
  PaginatedResult,
  PaginationDto,
  paginate,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePersonDto): Promise<Person> {
    return this.prisma.person.create({
      data: {
        displayName: dto.displayName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : undefined,
        biographyText: dto.biographyText,
        isHistoricalOnly: dto.isHistoricalOnly,
      },
    });
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Person>> {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.person.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.person.count({ where }),
    ]);
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person || person.deletedAt) {
      throw new NotFoundException('Persona no encontrada');
    }
    return person;
  }

  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    await this.findOne(id);
    return this.prisma.person.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : undefined,
        biographyText: dto.biographyText,
        isHistoricalOnly: dto.isHistoricalOnly,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
