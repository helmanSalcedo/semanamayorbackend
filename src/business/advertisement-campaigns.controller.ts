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
import { PaginationDto } from '../common/dto/pagination.dto';
import { AdvertisementCampaignsService } from './advertisement-campaigns.service';
import { CreateAdvertisementCampaignDto } from './dto/create-advertisement-campaign.dto';
import { UpdateAdvertisementCampaignDto } from './dto/update-advertisement-campaign.dto';

@ApiTags('business')
@Controller('advertisement-campaigns')
@Permissions('advertisement.manage')
export class AdvertisementCampaignsController {
  constructor(
    private readonly campaignsService: AdvertisementCampaignsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea una campaña publicitaria' })
  create(@Body() dto: CreateAdvertisementCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista campañas publicitarias (uso interno)' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.campaignsService.findAll(pagination, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una campaña publicitaria' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza una campaña publicitaria' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdvertisementCampaignDto,
  ) {
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina una campaña publicitaria (y sus anuncios)',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.campaignsService.remove(id);
  }
}
