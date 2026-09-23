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
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { FindSponsorshipsDto } from './dto/find-sponsorships.dto';
import { UpdateSponsorshipStatusDto } from './dto/update-sponsorship-status.dto';
import { SponsorshipsService } from './sponsorships.service';

@ApiTags('business')
@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  @Permissions('sponsorship.manage')
  @ApiOperation({
    summary: 'Registra un patrocinio de una organización sobre una entidad',
  })
  create(@Body() dto: CreateSponsorshipDto) {
    return this.sponsorshipsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista patrocinios (filtrable por organización/entidad)',
  })
  findAll(@Query() query: FindSponsorshipsDto) {
    return this.sponsorshipsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un patrocinio' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sponsorshipsService.findOne(id);
  }

  @Patch(':id/status')
  @Permissions('sponsorship.manage')
  @ApiOperation({ summary: 'Cambia el estado de un patrocinio' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSponsorshipStatusDto,
  ) {
    return this.sponsorshipsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Permissions('sponsorship.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un patrocinio' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.sponsorshipsService.remove(id);
  }
}
