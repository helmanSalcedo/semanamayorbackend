import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFestivalDto {
  @ApiProperty()
  @IsUUID()
  municipalityId!: string;

  @ApiProperty({ example: 'Semana Santa de Timbío' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    description: 'Se genera a partir de name si se omite',
    example: 'semana-santa-de-timbio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  historicalDescription?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;
}
