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
import { AddGalleryItemDto } from './dto/add-gallery-item.dto';
import { GalleryItemsService } from './gallery-items.service';

@ApiTags('media')
@Controller('galleries/:galleryId/items')
export class GalleryItemsController {
  constructor(private readonly galleryItemsService: GalleryItemsService) {}

  @Post()
  @Permissions('media_asset.manage')
  @ApiOperation({ summary: 'Agrega un archivo ya subido a la galería' })
  add(
    @Param('galleryId', ParseUUIDPipe) galleryId: string,
    @Body() dto: AddGalleryItemDto,
  ) {
    return this.galleryItemsService.add(galleryId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los archivos de una galería' })
  findAll(@Param('galleryId', ParseUUIDPipe) galleryId: string) {
    return this.galleryItemsService.findAllByGallery(galleryId);
  }

  @Delete(':itemId')
  @Permissions('media_asset.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Quita un archivo de la galería (no borra el MediaAsset)',
  })
  async remove(
    @Param('galleryId', ParseUUIDPipe) galleryId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.galleryItemsService.remove(galleryId, itemId);
  }
}
