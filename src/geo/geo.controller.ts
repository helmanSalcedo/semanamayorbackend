import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller()
@Public()
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Catálogo de países (seeded)' })
  findAllCountries() {
    return this.geoService.findAllCountries();
  }

  @Get('departments')
  @ApiOperation({ summary: 'Catálogo de departamentos, filtrable por país' })
  findAllDepartments(@Query('countryId') countryId?: string) {
    return this.geoService.findAllDepartments(countryId);
  }

  @Get('municipalities')
  @ApiOperation({
    summary: 'Catálogo de municipios, filtrable por departamento',
  })
  findAllMunicipalities(@Query('departmentId') departmentId?: string) {
    return this.geoService.findAllMunicipalities(departmentId);
  }

  @Get('localities')
  @ApiOperation({
    summary:
      'Catálogo de localidades (barrios/veredas), filtrable por municipio',
  })
  findAllLocalities(@Query('municipalityId') municipalityId?: string) {
    return this.geoService.findAllLocalities(municipalityId);
  }
}
