import { Injectable } from '@nestjs/common';
import { Country, Department, Locality, Municipality } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  findAllCountries(): Promise<Country[]> {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  findAllDepartments(countryId?: string): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
    });
  }

  findAllMunicipalities(departmentId?: string): Promise<Municipality[]> {
    return this.prisma.municipality.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
  }

  findAllLocalities(municipalityId?: string): Promise<Locality[]> {
    return this.prisma.locality.findMany({
      where: { municipalityId },
      orderBy: { name: 'asc' },
    });
  }
}
