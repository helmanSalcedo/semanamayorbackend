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
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { FindFinancialTransactionsDto } from './dto/find-financial-transactions.dto';
import { ReverseFinancialTransactionDto } from './dto/reverse-financial-transaction.dto';
import { FinancialTransactionsService } from './financial-transactions.service';

@ApiTags('finance')
@Controller('financial-transactions')
@Permissions('financial_transaction.manage')
export class FinancialTransactionsController {
  constructor(
    private readonly transactionsService: FinancialTransactionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registra un asiento en el ledger (append-only)' })
  create(
    @Body() dto: CreateFinancialTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista el ledger (filtrable por categoría/tipo/campaña)',
  })
  findAll(@Query() query: FindFinancialTransactionsDto) {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un asiento' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post(':id/reverse')
  @ApiOperation({
    summary:
      'Registra la reversa de un asiento (nunca se edita/borra el original)',
  })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseFinancialTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.reverse(id, dto, user.sub);
  }
}
