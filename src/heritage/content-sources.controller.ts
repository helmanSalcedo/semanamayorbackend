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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ContentSourcesService } from './content-sources.service';
import { CreateContentSourceDto } from './dto/create-content-source.dto';
import { FindContentSourcesDto } from './dto/find-content-sources.dto';

@ApiTags('sources')
@Controller('content-sources')
export class ContentSourcesController {
  constructor(private readonly contentSourcesService: ContentSourcesService) {}

  @Post()
  @Permissions('source.manage')
  @ApiOperation({
    summary:
      'Cita una fuente en cualquier entidad citable (persona, paso, evento, etc.)',
  })
  create(@Body() dto: CreateContentSourceDto) {
    return this.contentSourcesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista las fuentes citadas para una entidad' })
  findBySourceable(@Query() query: FindContentSourcesDto) {
    return this.contentSourcesService.findBySourceable(
      query.sourceableType,
      query.sourceableId,
    );
  }

  @Delete(':id')
  @Permissions('source.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita una cita de fuente' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.contentSourcesService.remove(id);
  }
}
