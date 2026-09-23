import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GenerateFinancialReportDto {
  @ApiPropertyOptional({
    description: 'Si se omite, el reporte cubre todas las campañas',
  })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({ example: '2027-04-30' })
  @IsDateString()
  periodEnd!: string;
}
