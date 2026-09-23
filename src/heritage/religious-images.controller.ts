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
import { CreateReligiousImageDto } from './dto/create-religious-image.dto';
import { UpdateReligiousImageDto } from './dto/update-religious-image.dto';
import { ReligiousImagesService } from './religious-images.service';

@ApiTags('festivals')
@Controller('festivals/:festivalId/steps/:stepId/religious-images')
export class ReligiousImagesController {
  constructor(private readonly imagesService: ReligiousImagesService) {}

  @Post()
  @Permissions('religious_image.manage')
  @ApiOperation({
    summary: 'Crea una imagen religiosa dentro de un paso procesional',
  })
  create(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: CreateReligiousImageDto,
  ) {
    return this.imagesService.create(festivalId, stepId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista las imágenes religiosas de un paso procesional',
  })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.imagesService.findAllByStep(festivalId, stepId, pagination);
  }

  @Public()
  @Get(':imageId')
  @ApiOperation({ summary: 'Detalle de una imagen religiosa' })
  findOne(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.imagesService.findOne(festivalId, stepId, imageId);
  }

  @Patch(':imageId')
  @Permissions('religious_image.manage')
  @ApiOperation({ summary: 'Actualiza una imagen religiosa' })
  update(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateReligiousImageDto,
  ) {
    return this.imagesService.update(festivalId, stepId, imageId, dto);
  }

  @Delete(':imageId')
  @Permissions('religious_image.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una imagen religiosa' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<void> {
    await this.imagesService.remove(festivalId, stepId, imageId);
  }
}
