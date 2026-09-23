import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AdvertisementPlacementsService } from './advertisement-placements.service';

@ApiTags('business')
@Controller('advertisement-placements')
export class AdTrackingController {
  constructor(
    private readonly placementsService: AdvertisementPlacementsService,
  ) {}

  @Public()
  @Post(':id/impression')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registra una impresión de un anuncio (contador)' })
  async recordImpression(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.placementsService.recordImpression(id);
  }

  @Public()
  @Post(':id/click')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registra un clic de un anuncio (contador)' })
  async recordClick(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.placementsService.recordClick(id);
  }
}
