import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFestivalEditionDto {
  @ApiProperty({ example: 2027 })
  @IsInt()
  @Min(1800)
  @Max(2200)
  year!: number;

  @ApiProperty({ example: 'Semana Santa de Timbío 2027' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({ example: '2027-03-28' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-04-04' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  officialProgramUrl?: string;
}
