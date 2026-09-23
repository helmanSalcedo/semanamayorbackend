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
import { ContentRightsService } from './content-rights.service';
import { CreateContentRightsDto } from './dto/create-content-rights.dto';
import { FindContentRightsDto } from './dto/find-content-rights.dto';
import { UpdateContentRightsDto } from './dto/update-content-rights.dto';

@ApiTags('sources')
@Controller('content-rights')
export class ContentRightsController {
  constructor(private readonly contentRightsService: ContentRightsService) {}

  @Post()
  @Permissions('source.manage')
  @ApiOperation({
    summary: 'Registra el estado de derechos de un archivo/patrimonio',
  })
  create(@Body() dto: CreateContentRightsDto) {
    return this.contentRightsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los registros de derechos de una entidad' })
  findBySubject(@Query() query: FindContentRightsDto) {
    return this.contentRightsService.findBySubject(
      query.subjectType,
      query.subjectId,
    );
  }

  @Patch(':id')
  @Permissions('source.manage')
  @ApiOperation({ summary: 'Actualiza un registro de derechos' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentRightsDto,
  ) {
    return this.contentRightsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('source.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un registro de derechos' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.contentRightsService.remove(id);
  }
}
