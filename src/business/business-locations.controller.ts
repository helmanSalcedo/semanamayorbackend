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
import { BusinessLocationsService } from './business-locations.service';
import { CreateBusinessLocationDto } from './dto/create-business-location.dto';

@ApiTags('business')
@Controller('businesses/:businessId/locations')
export class BusinessLocationsController {
  constructor(private readonly locationsService: BusinessLocationsService) {}

  @Post()
  @Permissions('business.manage')
  @ApiOperation({ summary: 'Añade una sede a un negocio' })
  add(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreateBusinessLocationDto,
  ) {
    return this.locationsService.add(businessId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista las sedes de un negocio' })
  findAll(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.locationsService.findAll(businessId);
  }

  @Delete(':locationId')
  @Permissions('business.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una sede' })
  async remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ): Promise<void> {
    await this.locationsService.remove(businessId, locationId);
  }
}
