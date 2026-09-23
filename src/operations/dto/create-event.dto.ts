import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Procesión del Santo Entierro' })
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

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  eventType!: EventType;

  @ApiProperty({ example: '2027-03-30T19:00:00.000Z' })
  @IsDateString()
  startDatetime!: string;

  @ApiPropertyOptional({ example: '2027-03-30T22:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDatetime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  religiousSiteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
