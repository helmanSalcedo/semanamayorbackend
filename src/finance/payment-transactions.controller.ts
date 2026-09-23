import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { PaymentTransactionsService } from './payment-transactions.service';

@ApiTags('finance')
@Controller('donations/:donationId/transactions')
export class PaymentTransactionsController {
  constructor(
    private readonly transactionsService: PaymentTransactionsService,
  ) {}

  @Post()
  @Permissions('donation.create')
  @ApiOperation({
    summary:
      'Registra un intento/resultado de pago para una donación. TODO: en producción esto debe venir de un webhook firmado del proveedor, no de este endpoint autenticado directo (ver README)',
  })
  create(
    @Param('donationId', ParseUUIDPipe) donationId: string,
    @Body() dto: CreatePaymentTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.create(donationId, dto, user.sub);
  }

  @Get()
  @Permissions('donation.read')
  @ApiOperation({ summary: 'Lista las transacciones de pago de una donación' })
  findAll(
    @Param('donationId', ParseUUIDPipe) donationId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.transactionsService.findAllByDonation(donationId, pagination);
  }

  @Get(':transactionId')
  @Permissions('donation.read')
  @ApiOperation({ summary: 'Detalle de una transacción de pago' })
  findOne(
    @Param('donationId', ParseUUIDPipe) donationId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.transactionsService.findOne(donationId, transactionId);
  }
}
