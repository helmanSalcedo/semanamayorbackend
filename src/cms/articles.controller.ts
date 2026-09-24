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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesDto } from './dto/find-articles.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('cms')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Permissions('article.create')
  @ApiOperation({
    summary: 'Crea un artículo (queda en DRAFT hasta publicarlo)',
  })
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.create(dto, user.sub);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista artículos publicados (el sitio público nunca ve drafts)',
  })
  findPublished(@Query() query: FindArticlesDto) {
    return this.articlesService.findPublished(query);
  }

  @Get('manage')
  @Permissions('article.create')
  @ApiOperation({
    summary: 'Vista editorial: todos los estados, para el flujo de redacción',
  })
  findAllForManagement(@Query() query: FindArticlesDto) {
    return this.articlesService.findAllForManagement(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un artículo publicado' })
  findPublishedOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findPublishedOne(id);
  }

  @Get(':id/manage')
  @Permissions('article.create')
  @ApiOperation({ summary: 'Detalle de un artículo en cualquier estado' })
  findOneForManagement(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOneForManagement(id);
  }

  @Get(':id/versions')
  @Permissions('article.create')
  @ApiOperation({ summary: 'Historial de versiones de un artículo' })
  listVersions(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.listVersions(id);
  }

  @Patch(':id')
  @Permissions('article.create')
  @ApiOperation({
    summary:
      'Actualiza un artículo (guarda la versión anterior en el historial)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.update(id, dto, user.sub);
  }

  @Post(':id/publish')
  @Permissions('article.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica un artículo' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.publish(id, user.sub);
  }

  @Post(':id/unpublish')
  @Permissions('article.unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Despublica un artículo (vuelve a DRAFT)' })
  unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.unpublish(id, user.sub);
  }

  @Delete(':id')
  @Permissions('article.create')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un artículo' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.articlesService.remove(id);
  }
}
