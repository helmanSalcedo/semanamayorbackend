import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Acta de fundación de la Junta 1952' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '1952-03-20' })
  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @ApiPropertyOptional({
    description: 'MediaAsset con el archivo escaneado/digitalizado',
  })
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceId?: string;
}
