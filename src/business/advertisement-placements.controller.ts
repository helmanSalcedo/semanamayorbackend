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
import { AdvertisementPlacementsService } from './advertisement-placements.service';
import { CreateAdvertisementPlacementDto } from './dto/create-advertisement-placement.dto';

@ApiTags('business')
@Controller('advertisements/:advertisementId/placements')
@Permissions('advertisement.manage')
export class AdvertisementPlacementsController {
  constructor(
    private readonly placementsService: AdvertisementPlacementsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crea una ubicación (zona/periodo) para un anuncio',
  })
  add(
    @Param('advertisementId', ParseUUIDPipe) advertisementId: string,
    @Body() dto: CreateAdvertisementPlacementDto,
  ) {
    return this.placementsService.add(advertisementId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista las ubicaciones de un anuncio' })
  findAll(@Param('advertisementId', ParseUUIDPipe) advertisementId: string) {
    return this.placementsService.findAll(advertisementId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una ubicación' })
  async remove(
    @Param('advertisementId', ParseUUIDPipe) advertisementId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.placementsService.remove(advertisementId, id);
  }
}
