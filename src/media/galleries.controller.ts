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
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleriesService } from './galleries.service';

@ApiTags('media')
@Controller('galleries')
export class GalleriesController {
  constructor(private readonly galleriesService: GalleriesService) {}

  @Post()
  @Permissions('media_asset.manage')
  @ApiOperation({ summary: 'Crea una galería' })
  create(@Body() dto: CreateGalleryDto) {
    return this.galleriesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista galerías (filtrable por festivalEditionId)' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('festivalEditionId') festivalEditionId?: string,
  ) {
    return this.galleriesService.findAll(pagination, festivalEditionId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una galería' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('media_asset.manage')
  @ApiOperation({ summary: 'Actualiza una galería' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryDto,
  ) {
    return this.galleriesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('media_asset.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una galería' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.galleriesService.remove(id);
  }
}
