import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdvertisementPlacementDto {
  @ApiProperty({ example: 'home_banner_top' })
  @IsString()
  @MaxLength(80)
  placementZone!: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-04-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
