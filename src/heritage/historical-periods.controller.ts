import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateHistoricalPeriodDto } from './dto/create-historical-period.dto';
import { UpdateHistoricalPeriodDto } from './dto/update-historical-period.dto';
import { HistoricalPeriodsService } from './historical-periods.service';

@ApiTags('historical')
@Controller('historical-periods')
export class HistoricalPeriodsController {
  constructor(private readonly periodsService: HistoricalPeriodsService) {}

  @Post()
  @Permissions('historical_content.manage')
  @ApiOperation({ summary: 'Crea un periodo histórico' })
  create(@Body() dto: CreateHistoricalPeriodDto) {
    return this.periodsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista periodos históricos' })
  findAll(@Query() pagination: PaginationDto) {
    return this.periodsService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un periodo histórico' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.periodsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('historical_content.manage')
  @ApiOperation({ summary: 'Actualiza un periodo histórico' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHistoricalPeriodDto,
  ) {
    return this.periodsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('historical_content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un periodo histórico' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.periodsService.remove(id);
  }
}
