import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePersonDto {
  @ApiProperty({ example: 'Don José María Pérez' })
  @IsString()
  @MaxLength(200)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '1930-05-12' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: '2005-11-03' })
  @IsOptional()
  @IsDateString()
  deathDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  biographyText?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'true si es una figura solo histórica, sin cuenta de usuario ni rol operativo actual',
  })
  @IsOptional()
  @IsBoolean()
  isHistoricalOnly?: boolean;
}
