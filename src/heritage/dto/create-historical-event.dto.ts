import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatePrecision, HistoricalReliability } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateHistoricalEventDto {
  @ApiProperty({ example: 'Fundación de la cofradía del Santo Sepulcro' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Se genera a partir de title si se omite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  festivalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ example: '1932-03-15' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ enum: DatePrecision, default: DatePrecision.UNKNOWN })
  @IsOptional()
  @IsEnum(DatePrecision)
  datePrecision?: DatePrecision;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    enum: HistoricalReliability,
    default: HistoricalReliability.PROBABLE,
  })
  @IsOptional()
  @IsEnum(HistoricalReliability)
  reliabilityLevel?: HistoricalReliability;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editorialNotes?: string;
}
