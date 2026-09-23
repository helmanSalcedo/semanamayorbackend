import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdvertisementType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, IsUrl, MaxLength } from 'class-validator';

export class CreateAdvertisementDto {
  @ApiProperty({ enum: AdvertisementType })
  @IsEnum(AdvertisementType)
  type!: AdvertisementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  creativeMediaAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  targetUrl?: string;
}
