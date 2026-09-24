import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('heritage')
@Controller('role-types')
export class RoleTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Catálogo de tipos de rol cultural (síndico, carguero, sahumadora, etc.)',
  })
  findAll() {
    return this.prisma.roleType.findMany({ orderBy: { name: 'asc' } });
  }
}
