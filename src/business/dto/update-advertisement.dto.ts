import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateAdvertisementDto } from './create-advertisement.dto';

export class UpdateAdvertisementDto extends PartialType(
  CreateAdvertisementDto,
) {
  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
