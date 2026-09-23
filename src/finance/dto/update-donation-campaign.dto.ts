import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DonationCampaignStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateDonationCampaignDto } from './create-donation-campaign.dto';

export class UpdateDonationCampaignDto extends PartialType(
  CreateDonationCampaignDto,
) {
  @ApiPropertyOptional({ enum: DonationCampaignStatus })
  @IsOptional()
  @IsEnum(DonationCampaignStatus)
  status?: DonationCampaignStatus;
}
