import { ApiProperty } from '@nestjs/swagger';
import { SourceableType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class FindContentSourcesDto {
  @ApiProperty({ enum: SourceableType })
  @IsEnum(SourceableType)
  sourceableType!: SourceableType;

  @ApiProperty()
  @IsUUID()
  sourceableId!: string;
}
