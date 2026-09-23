import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AddEventStepDto } from './dto/add-event-step.dto';
import { EventStepsService } from './event-steps.service';

@ApiTags('operations')
@Controller('festivals/:festivalId/editions/:editionId/events/:eventId/steps')
export class EventStepsController {
  constructor(private readonly eventStepsService: EventStepsService) {}

  @Post()
  @Permissions('event.manage')
  @ApiOperation({ summary: 'Vincula un paso procesional a un evento' })
  add(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: AddEventStepDto,
  ) {
    return this.eventStepsService.add(festivalId, editionId, eventId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los pasos procesionales de un evento' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventStepsService.findAll(festivalId, editionId, eventId);
  }

  @Delete(':itemId')
  @Permissions('event.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita el vínculo evento-paso' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.eventStepsService.remove(festivalId, editionId, eventId, itemId);
  }
}
