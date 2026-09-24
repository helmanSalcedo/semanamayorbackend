import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('finance')
@Controller('payment-providers')
export class PaymentProvidersController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Catálogo de proveedores de pago (código a usar en providerCode)',
  })
  findAll() {
    return this.prisma.paymentProvider.findMany({ orderBy: { name: 'asc' } });
  }
}
