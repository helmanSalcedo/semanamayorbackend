import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessLocation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from './businesses.service';
import { CreateBusinessLocationDto } from './dto/create-business-location.dto';

@Injectable()
export class BusinessLocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async add(
    businessId: string,
    dto: CreateBusinessLocationDto,
  ): Promise<BusinessLocation> {
    await this.businessesService.findOne(businessId);
    const municipality = await this.prisma.municipality.findUnique({
      where: { id: dto.municipalityId },
    });
    if (!municipality) {
      throw new BadRequestException('El municipio indicado no existe');
    }

    return this.prisma.businessLocation.create({
      data: {
        businessId,
        municipalityId: dto.municipalityId,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async findAll(businessId: string): Promise<BusinessLocation[]> {
    await this.businessesService.findOne(businessId);
    return this.prisma.businessLocation.findMany({ where: { businessId } });
  }

  async remove(businessId: string, locationId: string): Promise<void> {
    await this.businessesService.findOne(businessId);
    const location = await this.prisma.businessLocation.findUnique({
      where: { id: locationId },
    });
    if (!location || location.businessId !== businessId) {
      throw new NotFoundException('Sede no encontrada');
    }
    await this.prisma.businessLocation.delete({ where: { id: locationId } });
  }
}
