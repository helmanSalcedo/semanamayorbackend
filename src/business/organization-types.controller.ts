import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('business')
@Controller('organization-types')
export class OrganizationTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo de tipos de organización (seeded)' })
  findAll() {
    return this.prisma.organizationType.findMany({ orderBy: { name: 'asc' } });
  }
}
