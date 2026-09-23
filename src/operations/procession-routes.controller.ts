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
import { Public } from '../auth/decorators/public.decorator';
import { CreateProcessionRouteDto } from './dto/create-procession-route.dto';
import { ProcessionRoutesService } from './procession-routes.service';

@ApiTags('operations')
@Controller(
  'festivals/:festivalId/editions/:editionId/processions/:processionId/routes',
)
export class ProcessionRoutesController {
  constructor(private readonly routesService: ProcessionRoutesService) {}

  @Post()
  @Permissions('procession.manage')
  @ApiOperation({ summary: 'Crea una ruta para una procesión' })
  create(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Body() dto: CreateProcessionRouteDto,
  ) {
    return this.routesService.create(festivalId, editionId, processionId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista las rutas de una procesión (con sus puntos)',
  })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
  ) {
    return this.routesService.findAll(festivalId, editionId, processionId);
  }

  @Public()
  @Get(':routeId')
  @ApiOperation({ summary: 'Detalle de una ruta' })
  findOne(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    return this.routesService.findOne(
      festivalId,
      editionId,
      processionId,
      routeId,
    );
  }

  @Delete(':routeId')
  @Permissions('procession.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una ruta (y sus puntos, en cascada)' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ): Promise<void> {
    await this.routesService.remove(
      festivalId,
      editionId,
      processionId,
      routeId,
    );
  }
}
