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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('media')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Permissions('source.manage')
  @ApiOperation({ summary: 'Registra un documento histórico' })
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista documentos' })
  findAll(@Query() pagination: PaginationDto) {
    return this.documentsService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un documento' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Public()
  @Get(':id/versions')
  @ApiOperation({ summary: 'Historial de versiones de un documento' })
  listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.listVersions(id);
  }

  @Patch(':id')
  @Permissions('source.manage')
  @ApiOperation({
    summary:
      'Actualiza un documento (guarda la versión anterior en el historial)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @Permissions('source.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un documento' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.documentsService.remove(id);
  }
}
