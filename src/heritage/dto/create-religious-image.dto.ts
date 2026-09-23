import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConservationStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReligiousImageDto {
  @ApiProperty({ example: 'Cristo Yacente' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  sculptor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  provenance?: string;

  @ApiPropertyOptional({
    minimum: 1500,
    maximum: 2200,
    description: 'Año estimado — las fechas históricas suelen ser aproximadas',
  })
  @IsOptional()
  @IsInt()
  @Min(1500)
  @Max(2200)
  approxYear?: number;

  @ApiPropertyOptional({ example: 'circa 1920' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  dateNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  dimensions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ enum: ConservationStatus })
  @IsOptional()
  @IsEnum(ConservationStatus)
  conservationStatus?: ConservationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restorationsNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
