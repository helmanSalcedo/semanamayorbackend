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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateSponsorshipPackageDto } from './dto/create-sponsorship-package.dto';
import { UpdateSponsorshipPackageDto } from './dto/update-sponsorship-package.dto';
import { SponsorshipPackagesService } from './sponsorship-packages.service';

@ApiTags('business')
@Controller('sponsorship-packages')
export class SponsorshipPackagesController {
  constructor(private readonly packagesService: SponsorshipPackagesService) {}

  @Post()
  @Permissions('sponsorship.manage')
  @ApiOperation({ summary: 'Crea un paquete de patrocinio' })
  create(@Body() dto: CreateSponsorshipPackageDto) {
    return this.packagesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los paquetes de patrocinio' })
  findAll() {
    return this.packagesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un paquete de patrocinio' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('sponsorship.manage')
  @ApiOperation({ summary: 'Actualiza un paquete de patrocinio' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSponsorshipPackageDto,
  ) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('sponsorship.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un paquete de patrocinio' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.packagesService.remove(id);
  }
}
