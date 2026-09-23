import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGalleryDto {
  @ApiProperty({ example: 'Semana Santa 2027 — fotos' })
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
  @IsUUID()
  festivalEditionId?: string;

  @ApiPropertyOptional({ description: 'Debe ser un MediaAsset ya subido' })
  @IsOptional()
  @IsUUID()
  coverMediaAssetId?: string;
}
