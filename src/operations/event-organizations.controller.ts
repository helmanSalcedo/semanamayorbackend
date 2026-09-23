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
import { AddEventOrganizationDto } from './dto/add-event-organization.dto';
import { EventOrganizationsService } from './event-organizations.service';

@ApiTags('operations')
@Controller(
  'festivals/:festivalId/editions/:editionId/events/:eventId/organizations',
)
export class EventOrganizationsController {
  constructor(
    private readonly eventOrganizationsService: EventOrganizationsService,
  ) {}

  @Post()
  @Permissions('event.manage')
  @ApiOperation({
    summary:
      'Vincula una organización a un evento (patrocinador, organizador, etc.)',
  })
  add(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: AddEventOrganizationDto,
  ) {
    return this.eventOrganizationsService.add(
      festivalId,
      editionId,
      eventId,
      dto,
    );
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista las organizaciones vinculadas a un evento' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ) {
    return this.eventOrganizationsService.findAll(
      festivalId,
      editionId,
      eventId,
    );
  }

  @Delete(':itemId')
  @Permissions('event.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita el vínculo evento-organización' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.eventOrganizationsService.remove(
      festivalId,
      editionId,
      eventId,
      itemId,
    );
  }
}
