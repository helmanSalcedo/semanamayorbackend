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
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GenerateFinancialReportDto } from './dto/generate-financial-report.dto';
import { FinancialReportsService } from './financial-reports.service';

@ApiTags('finance')
@Controller('financial-reports')
export class FinancialReportsController {
  constructor(private readonly reportsService: FinancialReportsService) {}

  @Post()
  @Permissions('financial_report.publish')
  @ApiOperation({
    summary:
      'Genera un snapshot de transparencia para un periodo (fijo, no en vivo)',
  })
  generate(
    @Body() dto: GenerateFinancialReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.generate(dto, user.sub);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los reportes de transparencia publicados' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.reportsService.findAll(pagination, campaignId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un reporte' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.findOne(id);
  }
}
