import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHistoricalPeriodDto {
  @ApiProperty({ example: 'Colonia' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    description: 'Se genera a partir de name si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 2200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2200)
  startYear?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 2200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2200)
  endYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
