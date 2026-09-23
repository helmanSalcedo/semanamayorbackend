import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: 'Así se preparó la Semana Santa de Timbío en 2026' })
  @IsString()
  @MaxLength(220)
  title!: string;

  @ApiPropertyOptional({
    description: 'Se genera a partir de title si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  slug?: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  festivalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coverMediaAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  socialImageMediaAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  canonicalUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'Ids de Tag existentes' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];
}
