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
import { CreateProcessionDto } from './dto/create-procession.dto';
import { UpdateProcessionDto } from './dto/update-procession.dto';
import { ProcessionsService } from './processions.service';

@ApiTags('operations')
@Controller('festivals/:festivalId/editions/:editionId/processions')
export class ProcessionsController {
  constructor(private readonly processionsService: ProcessionsService) {}

  @Post()
  @Permissions('procession.manage')
  @ApiOperation({ summary: 'Crea una procesión de una edición' })
  create(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Body() dto: CreateProcessionDto,
  ) {
    return this.processionsService.create(festivalId, editionId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista las procesiones de una edición' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.processionsService.findAllByEdition(
      festivalId,
      editionId,
      pagination,
    );
  }

  @Public()
  @Get(':processionId')
  @ApiOperation({ summary: 'Detalle de una procesión' })
  findOne(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
  ) {
    return this.processionsService.findOne(festivalId, editionId, processionId);
  }

  @Patch(':processionId')
  @Permissions('procession.manage')
  @ApiOperation({ summary: 'Actualiza una procesión' })
  update(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Body() dto: UpdateProcessionDto,
  ) {
    return this.processionsService.update(
      festivalId,
      editionId,
      processionId,
      dto,
    );
  }

  @Delete(':processionId')
  @Permissions('procession.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una procesión' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
  ): Promise<void> {
    await this.processionsService.remove(festivalId, editionId, processionId);
  }
}
