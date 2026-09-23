import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialCategoryType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateFinancialTransactionDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ enum: FinancialCategoryType })
  @IsEnum(FinancialCategoryType)
  type!: FinancialCategoryType;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ default: 'COP' })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedDonationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedCampaignId?: string;

  @ApiProperty({ example: '2027-04-01' })
  @IsDateString()
  occurredAt!: string;
}
