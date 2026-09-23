import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AddRoutePointDto } from './dto/add-route-point.dto';
import { RoutePointsService } from './route-points.service';

@ApiTags('operations')
@Controller(
  'festivals/:festivalId/editions/:editionId/processions/:processionId/routes/:routeId/points',
)
export class RoutePointsController {
  constructor(private readonly pointsService: RoutePointsService) {}

  @Post()
  @Permissions('procession.manage')
  @ApiOperation({ summary: 'Agrega un punto (lat/lng) a la ruta' })
  add(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Body() dto: AddRoutePointDto,
  ) {
    return this.pointsService.add(
      festivalId,
      editionId,
      processionId,
      routeId,
      dto,
    );
  }

  @Delete(':pointId')
  @Permissions('procession.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita un punto de la ruta' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Param('pointId', ParseUUIDPipe) pointId: string,
  ): Promise<void> {
    await this.pointsService.remove(
      festivalId,
      editionId,
      processionId,
      routeId,
      pointId,
    );
  }
}
