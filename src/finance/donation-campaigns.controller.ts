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
import { DonationCampaignsService } from './donation-campaigns.service';
import { CreateDonationCampaignDto } from './dto/create-donation-campaign.dto';
import { UpdateDonationCampaignDto } from './dto/update-donation-campaign.dto';

@ApiTags('finance')
@Controller('donation-campaigns')
export class DonationCampaignsController {
  constructor(private readonly campaignsService: DonationCampaignsService) {}

  @Post()
  @Permissions('donation_campaign.manage')
  @ApiOperation({ summary: 'Crea una campaña de donación' })
  create(@Body() dto: CreateDonationCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista campañas de donación' })
  findAll(@Query() pagination: PaginationDto) {
    return this.campaignsService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una campaña' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.findOne(id);
  }

  @Public()
  @Get(':id/progress')
  @ApiOperation({
    summary:
      'Progreso de recaudo de una campaña (solo donaciones CONFIRMED, sin datos del donante)',
  })
  getProgress(@Param('id', ParseUUIDPipe) id: string) {
    return this.campaignsService.getProgress(id);
  }

  @Patch(':id')
  @Permissions('donation_campaign.manage')
  @ApiOperation({ summary: 'Actualiza una campaña' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonationCampaignDto,
  ) {
    return this.campaignsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('donation_campaign.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una campaña' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.campaignsService.remove(id);
  }
}
