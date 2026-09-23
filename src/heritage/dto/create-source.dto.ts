import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateSourceDto {
  @ApiProperty({ example: 'Historia de Timbío, tomo II' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ enum: SourceType })
  @IsEnum(SourceType)
  sourceType!: SourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  publisher?: string;

  @ApiPropertyOptional({ example: '1985-06-01' })
  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string;

  @ApiPropertyOptional({ description: 'Ej. signatura de archivo, caja/folio' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  archiveReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reliabilityNotes?: string;
}
