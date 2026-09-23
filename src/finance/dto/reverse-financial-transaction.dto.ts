import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReverseFinancialTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Por defecto, la fecha actual' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
