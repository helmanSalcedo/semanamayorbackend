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
import { CreateFestivalDto } from './dto/create-festival.dto';
import { UpdateFestivalDto } from './dto/update-festival.dto';
import { FestivalsService } from './festivals.service';

@ApiTags('festivals')
@Controller('festivals')
export class FestivalsController {
  constructor(private readonly festivalsService: FestivalsService) {}

  @Post()
  @Permissions('festival.manage')
  @ApiOperation({ summary: 'Crea una festividad' })
  create(@Body() dto: CreateFestivalDto) {
    return this.festivalsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista festividades' })
  findAll(@Query() pagination: PaginationDto) {
    return this.festivalsService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una festividad' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.festivalsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('festival.manage')
  @ApiOperation({ summary: 'Actualiza una festividad' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFestivalDto,
  ) {
    return this.festivalsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('festival.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una festividad' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.festivalsService.remove(id);
  }
}
