import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional({
    description: 'Se guarda en el historial de versiones del artículo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeSummary?: string;
}
