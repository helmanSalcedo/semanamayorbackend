import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SponsorshipPackage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSponsorshipPackageDto } from './dto/create-sponsorship-package.dto';
import { UpdateSponsorshipPackageDto } from './dto/update-sponsorship-package.dto';

@Injectable()
export class SponsorshipPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSponsorshipPackageDto): Promise<SponsorshipPackage> {
    return this.prisma.sponsorshipPackage.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency,
        benefits: dto.benefits as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAll(): Promise<SponsorshipPackage[]> {
    return this.prisma.sponsorshipPackage.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<SponsorshipPackage> {
    const pkg = await this.prisma.sponsorshipPackage.findUnique({
      where: { id },
    });
    if (!pkg) {
      throw new NotFoundException('Paquete de patrocinio no encontrado');
    }
    return pkg;
  }

  async update(
    id: string,
    dto: UpdateSponsorshipPackageDto,
  ): Promise<SponsorshipPackage> {
    await this.findOne(id);
    return this.prisma.sponsorshipPackage.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency,
        benefits: dto.benefits as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.sponsorshipPackage.delete({ where: { id } });
  }
}
