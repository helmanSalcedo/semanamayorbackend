import { ApiProperty } from '@nestjs/swagger';
import { AttachableType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class FindMediaAttachmentsDto {
  @ApiProperty({ enum: AttachableType })
  @IsEnum(AttachableType)
  attachableType!: AttachableType;

  @ApiProperty()
  @IsUUID()
  attachableId!: string;
}
