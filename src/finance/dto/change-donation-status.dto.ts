import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChangeDonationStatusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
