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
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsService } from './tags.service';

@ApiTags('cms')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Permissions('article.create')
  @ApiOperation({ summary: 'Crea una etiqueta' })
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista etiquetas' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Delete(':id')
  @Permissions('article.create')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una etiqueta' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tagsService.remove(id);
  }
}
