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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@ApiTags('business')
@Controller('advertisement-campaigns/:campaignId/advertisements')
@Permissions('advertisement.manage')
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un anuncio dentro de una campaña' })
  create(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: CreateAdvertisementDto,
  ) {
    return this.advertisementsService.create(campaignId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista los anuncios de una campaña' })
  findAll(@Param('campaignId', ParseUUIDPipe) campaignId: string) {
    return this.advertisementsService.findAll(campaignId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un anuncio' })
  findOne(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.advertisementsService.findOne(campaignId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un anuncio' })
  update(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdvertisementDto,
  ) {
    return this.advertisementsService.update(campaignId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un anuncio' })
  async remove(
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.advertisementsService.remove(campaignId, id);
  }
}
