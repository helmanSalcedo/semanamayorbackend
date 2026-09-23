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
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PeopleService } from './people.service';

@ApiTags('people')
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  @Permissions('person.manage')
  @ApiOperation({ summary: 'Crea una persona (histórica o actual)' })
  create(@Body() dto: CreatePersonDto) {
    return this.peopleService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista personas' })
  findAll(@Query() pagination: PaginationDto) {
    return this.peopleService.findAll(pagination);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una persona' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.peopleService.findOne(id);
  }

  @Patch(':id')
  @Permissions('person.manage')
  @ApiOperation({ summary: 'Actualiza una persona' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePersonDto) {
    return this.peopleService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('person.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) una persona' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.peopleService.remove(id);
  }
}
