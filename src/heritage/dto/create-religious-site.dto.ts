import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReligiousSiteType } from '@prisma/client';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReligiousSiteDto {
  @ApiProperty()
  @IsUUID()
  municipalityId!: string;

  @ApiProperty({ enum: ReligiousSiteType })
  @IsEnum(ReligiousSiteType)
  type!: ReligiousSiteType;

  @ApiProperty({ example: 'Iglesia San Sebastián' })
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
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  history?: string;
}
