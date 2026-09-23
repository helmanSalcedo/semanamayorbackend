import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('business')
@Controller('business-categories')
export class BusinessCategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo de categorías de negocio (seeded)' })
  findAll() {
    return this.prisma.businessCategory.findMany({ orderBy: { name: 'asc' } });
  }
}
