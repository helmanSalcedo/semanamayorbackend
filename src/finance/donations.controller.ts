import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ChangeDonationStatusDto } from './dto/change-donation-status.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { FindDonationsDto } from './dto/find-donations.dto';
import { UpdateDonorDocumentDto } from './dto/update-donor-document.dto';
import { DonationReceiptsService } from './donation-receipts.service';
import { DonationsService } from './donations.service';

@ApiTags('finance')
@Controller('donations')
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    private readonly receiptsService: DonationReceiptsService,
  ) {}

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

  @Get(':id/receipt/pdf')
  @Permissions('donation.read')
  @ApiProduces('application/pdf')
  @ApiOperation({
    summary:
      'Descarga el PDF del recibo (copia archivada, o generada al vuelo si no hay storage)',
  })
  async getReceiptPdf(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const file = await this.receiptsService.getPdf(id);
    return new StreamableFile(file.content, {
      type: 'application/pdf',
      disposition: `attachment; filename="${file.filename}"`,
      length: file.content.length,
    });
  }

  @Post(':id/receipt/resend')
  @Permissions('donation.create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reenvía el recibo en PDF al correo del donante (y lo archiva si faltaba)',
  })
  resendReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.receiptsService.resend(id);
  }

  @Patch(':id/donor-document')
  @Permissions('donation.create')
  @ApiOperation({
    summary:
      'Agrega o corrige el documento del donante (solo donaciones PENDING, antes de emitir el recibo)',
  })
  updateDonorDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonorDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.donationsService.updateDonorDocument(id, dto, user.sub);
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
