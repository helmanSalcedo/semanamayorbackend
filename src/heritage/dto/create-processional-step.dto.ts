import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConservationStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProcessionalStepDto {
  @ApiProperty({ example: 'El Nazareno' })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  historyText?: string;

  @ApiPropertyOptional({ minimum: 1500, maximum: 2200 })
  @IsOptional()
  @IsInt()
  @Min(1500)
  @Max(2200)
  originYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  provenance?: string;

  @ApiPropertyOptional({ enum: ConservationStatus })
  @IsOptional()
  @IsEnum(ConservationStatus)
  conservationStatus?: ConservationStatus;

  @ApiPropertyOptional({ example: '1985-04-01' })
  @IsOptional()
  @IsDateString()
  incorporatedAt?: string;

  @ApiPropertyOptional({ description: 'Orden dentro de la procesión' })
  @IsOptional()
  @IsInt()
  @Min(0)
  processionalOrder?: number;

  @ApiPropertyOptional({
    description: 'Debe ser un MediaAsset ya subido vía POST /media',
  })
  @IsOptional()
  @IsUUID()
  primaryMediaAssetId?: string;
}
