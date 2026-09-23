import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialCategoryType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFinancialCategoryDto {
  @ApiProperty({ example: 'Restauración' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: FinancialCategoryType })
  @IsEnum(FinancialCategoryType)
  type!: FinancialCategoryType;

  @ApiPropertyOptional({ description: 'Categoría padre, para subcategorías' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
