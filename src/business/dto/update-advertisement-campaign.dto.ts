import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateAdvertisementCampaignDto } from './create-advertisement-campaign.dto';

export class UpdateAdvertisementCampaignDto extends PartialType(
  CreateAdvertisementCampaignDto,
) {
  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
