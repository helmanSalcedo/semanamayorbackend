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
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('operations')
@Controller('festivals/:festivalId/editions/:editionId/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Permissions('event.manage')
  @ApiOperation({ summary: 'Crea un evento de la programación anual' })
  create(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(festivalId, editionId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los eventos de una edición' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.eventsService.findAllByEdition(
      festivalId,
      editionId,
      pagination,
    );
  }

  @Public()
  @Get(':eventId')
  @ApiOperation({ summary: 'Detalle de un evento' })
  findOne(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventsService.findOne(festivalId, editionId, eventId);
  }

  @Patch(':eventId')
  @Permissions('event.manage')
  @ApiOperation({ summary: 'Actualiza un evento' })
  update(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(festivalId, editionId, eventId, dto);
  }

  @Delete(':eventId')
  @Permissions('event.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un evento' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<void> {
    await this.eventsService.remove(festivalId, editionId, eventId);
  }
}
