import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ChangeDonationStatusDto } from './dto/change-donation-status.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { FindDonationsDto } from './dto/find-donations.dto';
import { DonationsService } from './donations.service';

@ApiTags('finance')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary:
      'Registra una intención de donación (estado PENDING) — no requiere cuenta',
  })
  create(@Body() dto: CreateDonationDto) {
    return this.donationsService.create(dto);
  }

  @Get()
  @Permissions('donation.read')
  @ApiOperation({
    summary: 'Lista donaciones (contiene PII del donante — no es público)',
  })
  findAll(@Query() query: FindDonationsDto) {
    return this.donationsService.findAll(query, query);
  }

  @Get(':id')
  @Permissions('donation.read')
  @ApiOperation({ summary: 'Detalle de una donación' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.donationsService.findOne(id);
  }

  @Get(':id/receipt')
  @Permissions('donation.read')
  @ApiOperation({ summary: 'Recibo de una donación confirmada' })
  getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.donationsService.getReceipt(id);
  }

  @Post(':id/confirm')
  @Permissions('donation.create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Confirma manualmente una donación PENDING (ej. pago MANUAL verificado) y emite recibo',
  })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeDonationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.donationsService.confirm(id, user.sub, dto.reason);
  }

  @Post(':id/cancel')
  @Permissions('donation.create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela una donación PENDING' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeDonationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.donationsService.cancel(id, user.sub, dto.reason);
  }

  @Post(':id/refund')
  @Permissions('donation.refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reembolsa una donación CONFIRMED' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeDonationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.donationsService.refund(id, user.sub, dto.reason);
  }
}
