import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachableType, MediaAttachmentRole } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMediaAttachmentDto {
  @ApiProperty()
  @IsUUID()
  mediaAssetId!: string;

  @ApiProperty({ enum: AttachableType })
  @IsEnum(AttachableType)
  attachableType!: AttachableType;

  @ApiProperty()
  @IsUUID()
  attachableId!: string;

  @ApiPropertyOptional({
    enum: MediaAttachmentRole,
    default: MediaAttachmentRole.GALLERY,
  })
  @IsOptional()
  @IsEnum(MediaAttachmentRole)
  role?: MediaAttachmentRole;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;
}
