import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MaxLength,
} from 'class-validator';

const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateProcessionDto {
  @ApiProperty({ example: 'Procesión del Viernes Santo' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: '2027-03-30' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '19:00' })
  @IsOptional()
  @Matches(TIME_HH_MM, { message: 'startTime debe tener formato HH:mm' })
  startTime?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @Matches(TIME_HH_MM, { message: 'estimatedEndTime debe tener formato HH:mm' })
  estimatedEndTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  startLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  endLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
