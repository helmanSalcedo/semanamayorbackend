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
import { CreateHistoricalEventDto } from './dto/create-historical-event.dto';
import { FindHistoricalEventsDto } from './dto/find-historical-events.dto';
import { UpdateHistoricalEventDto } from './dto/update-historical-event.dto';
import { HistoricalEventsService } from './historical-events.service';

@ApiTags('historical')
@Controller('historical-events')
export class HistoricalEventsController {
  constructor(private readonly eventsService: HistoricalEventsService) {}

  @Post()
  @Permissions('historical_content.manage')
  @ApiOperation({ summary: 'Crea un hecho histórico' })
  create(@Body() dto: CreateHistoricalEventDto) {
    return this.eventsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista hechos históricos (filtrable por festivalId/periodId)',
  })
  findAll(@Query() query: FindHistoricalEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un hecho histórico' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('historical_content.manage')
  @ApiOperation({ summary: 'Actualiza un hecho histórico' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHistoricalEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('historical_content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un hecho histórico' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.eventsService.remove(id);
  }
}
