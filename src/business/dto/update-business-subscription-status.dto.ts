import { ApiProperty } from '@nestjs/swagger';
import { BusinessSubscriptionStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBusinessSubscriptionStatusDto {
  @ApiProperty({ enum: BusinessSubscriptionStatus })
  @IsEnum(BusinessSubscriptionStatus)
  status!: BusinessSubscriptionStatus;
}
