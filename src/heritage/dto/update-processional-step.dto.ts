import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PublicationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProcessionalStepDto } from './create-processional-step.dto';

export class UpdateProcessionalStepDto extends PartialType(
  CreateProcessionalStepDto,
) {
  @ApiPropertyOptional({ enum: PublicationStatus })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;
}
