import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessContact } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from './businesses.service';
import { CreateBusinessContactDto } from './dto/create-business-contact.dto';

@Injectable()
export class BusinessContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async add(
    businessId: string,
    dto: CreateBusinessContactDto,
  ): Promise<BusinessContact> {
    await this.businessesService.findOne(businessId);
    return this.prisma.businessContact.create({
      data: { businessId, type: dto.type, value: dto.value },
    });
  }

  async findAll(businessId: string): Promise<BusinessContact[]> {
    await this.businessesService.findOne(businessId);
    return this.prisma.businessContact.findMany({ where: { businessId } });
  }

  async remove(businessId: string, contactId: string): Promise<void> {
    await this.businessesService.findOne(businessId);
    const contact = await this.prisma.businessContact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.businessId !== businessId) {
      throw new NotFoundException('Contacto no encontrado');
    }
    await this.prisma.businessContact.delete({ where: { id: contactId } });
  }
}
