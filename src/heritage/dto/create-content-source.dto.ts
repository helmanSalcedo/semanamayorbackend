import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceableType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContentSourceDto {
  @ApiProperty()
  @IsUUID()
  sourceId!: string;

  @ApiProperty({ enum: SourceableType })
  @IsEnum(SourceableType)
  sourceableType!: SourceableType;

  @ApiProperty()
  @IsUUID()
  sourceableId!: string;

  @ApiPropertyOptional({ description: 'Ej. "p. 42, párrafo 3"' })
  @IsOptional()
  @IsString()
  citationNote?: string;
}
