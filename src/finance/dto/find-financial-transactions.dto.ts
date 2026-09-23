import { ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialCategoryType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindFinancialTransactionsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: FinancialCategoryType })
  @IsOptional()
  @IsEnum(FinancialCategoryType)
  type?: FinancialCategoryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedCampaignId?: string;
}
