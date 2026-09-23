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
import { CreateReligiousSiteDto } from './dto/create-religious-site.dto';
import { UpdateReligiousSiteDto } from './dto/update-religious-site.dto';
import { ReligiousSitesService } from './religious-sites.service';

@ApiTags('religious-sites')
@Controller('religious-sites')
export class ReligiousSitesController {
  constructor(private readonly sitesService: ReligiousSitesService) {}

  @Post()
  @Permissions('religious_site.manage')
  @ApiOperation({ summary: 'Crea un sitio religioso/histórico' })
  create(@Body() dto: CreateReligiousSiteDto) {
    return this.sitesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista sitios religiosos/históricos' })
  findAll(@Query() pagination: PaginationDto) {
    return this.sitesService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un sitio' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('religious_site.manage')
  @ApiOperation({ summary: 'Actualiza un sitio' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReligiousSiteDto,
  ) {
    return this.sitesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('religious_site.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un sitio' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.sitesService.remove(id);
  }
}
