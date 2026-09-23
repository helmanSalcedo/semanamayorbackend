import { ApiProperty } from '@nestjs/swagger';
import { SponsorshipStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateSponsorshipStatusDto {
  @ApiProperty({ enum: SponsorshipStatus })
  @IsEnum(SponsorshipStatus)
  status!: SponsorshipStatus;
}
