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
import { BusinessStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { FindBusinessesDto } from './dto/find-businesses.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('business')
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Permissions('business.manage')
  @ApiOperation({
    summary: 'Registra un negocio en el directorio (estado PENDING_REVIEW)',
  })
  create(@Body() dto: CreateBusinessDto) {
    return this.businessesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista negocios activos del directorio público' })
  findAll(@Query() query: FindBusinessesDto) {
    return this.businessesService.findAllPublic(query);
  }

  @Get('manage')
  @Permissions('business.manage')
  @ApiOperation({
    summary: 'Lista negocios en cualquier estado (uso administrativo)',
  })
  findAllManaged(@Query() query: FindBusinessesDto) {
    return this.businessesService.findAllManaged(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un negocio' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('business.manage')
  @ApiOperation({ summary: 'Actualiza un negocio' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, dto);
  }

  @Post(':id/approve')
  @Permissions('business.approve')
  @ApiOperation({ summary: 'Aprueba un negocio (pasa a ACTIVE)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.businessesService.setStatus(
      id,
      BusinessStatus.ACTIVE,
      user.sub,
    );
  }

  @Post(':id/reject')
  @Permissions('business.approve')
  @ApiOperation({ summary: 'Rechaza/inactiva un negocio (pasa a INACTIVE)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.businessesService.setStatus(
      id,
      BusinessStatus.INACTIVE,
      user.sub,
    );
  }

  @Delete(':id')
  @Permissions('business.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un negocio' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.businessesService.remove(id);
  }
}
