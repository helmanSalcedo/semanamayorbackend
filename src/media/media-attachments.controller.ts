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
import { CreateMediaAttachmentDto } from './dto/create-media-attachment.dto';
import { FindMediaAttachmentsDto } from './dto/find-media-attachments.dto';
import { MediaAttachmentsService } from './media-attachments.service';

@ApiTags('media')
@Controller('media-attachments')
export class MediaAttachmentsController {
  constructor(private readonly attachmentsService: MediaAttachmentsService) {}

  @Post()
  @Permissions('media_asset.manage')
  @ApiOperation({
    summary:
      'Vincula un MediaAsset ya subido a cualquier entidad (festival, paso, imagen, etc.)',
  })
  create(@Body() dto: CreateMediaAttachmentDto) {
    return this.attachmentsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los archivos vinculados a una entidad' })
  findByAttachable(@Query() query: FindMediaAttachmentsDto) {
    return this.attachmentsService.findByAttachable(
      query.attachableType,
      query.attachableId,
    );
  }

  @Delete(':id')
  @Permissions('media_asset.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Quita el vínculo (no borra el MediaAsset ni el archivo)',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.attachmentsService.remove(id);
  }
}
