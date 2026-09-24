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
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { FamiliesService } from './families.service';

@ApiTags('heritage')
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @Permissions('person.manage')
  @ApiOperation({ summary: 'Crea una familia (para árboles genealógicos)' })
  create(@Body() dto: CreateFamilyDto) {
    return this.familiesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista familias' })
  findAll(@Query() pagination: PaginationDto) {
    return this.familiesService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una familia' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.familiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('person.manage')
  @ApiOperation({ summary: 'Actualiza una familia' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFamilyDto) {
    return this.familiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('person.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una familia' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.familiesService.remove(id);
  }
}
