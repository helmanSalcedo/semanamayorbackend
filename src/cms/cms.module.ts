import { Module } from '@nestjs/common';
import { ArticleCategoriesController } from './article-categories.controller';
import { ArticleCategoriesService } from './article-categories.service';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [
    ArticleCategoriesController,
    TagsController,
    ArticlesController,
  ],
  providers: [ArticleCategoriesService, TagsService, ArticlesService],
})
export class CmsModule {}
