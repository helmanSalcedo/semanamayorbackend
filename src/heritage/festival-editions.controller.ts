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
import { CreateFestivalEditionDto } from './dto/create-festival-edition.dto';
import { UpdateFestivalEditionDto } from './dto/update-festival-edition.dto';
import { FestivalEditionsService } from './festival-editions.service';

@ApiTags('festivals')
@Controller('festivals/:festivalId/editions')
export class FestivalEditionsController {
  constructor(private readonly editionsService: FestivalEditionsService) {}

  @Post()
  @Permissions('festival.manage')
  @ApiOperation({ summary: 'Crea una edición (año) de la festividad' })
  create(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Body() dto: CreateFestivalEditionDto,
  ) {
    return this.editionsService.create(festivalId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista las ediciones de una festividad' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.editionsService.findAllByFestival(festivalId, pagination);
  }

  @Public()
  @Get(':editionId')
  @ApiOperation({ summary: 'Detalle de una edición' })
  findOne(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
  ) {
    return this.editionsService.findOne(festivalId, editionId);
  }

  @Patch(':editionId')
  @Permissions('festival.manage')
  @ApiOperation({ summary: 'Actualiza una edición' })
  update(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Body() dto: UpdateFestivalEditionDto,
  ) {
    return this.editionsService.update(festivalId, editionId, dto);
  }

  @Delete(':editionId')
  @Permissions('festival.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina una edición (falla si tiene contenido asociado)',
  })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
  ): Promise<void> {
    await this.editionsService.remove(festivalId, editionId);
  }
}
