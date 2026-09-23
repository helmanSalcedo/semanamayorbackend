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
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  @Permissions('source.manage')
  @ApiOperation({
    summary: 'Registra una fuente documental (libro, acta, archivo, etc.)',
  })
  create(@Body() dto: CreateSourceDto) {
    return this.sourcesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista fuentes documentales' })
  findAll(@Query() pagination: PaginationDto) {
    return this.sourcesService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una fuente' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sourcesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('source.manage')
  @ApiOperation({ summary: 'Actualiza una fuente' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSourceDto) {
    return this.sourcesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('source.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una fuente' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.sourcesService.remove(id);
  }
}
