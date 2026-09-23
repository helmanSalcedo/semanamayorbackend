import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProcessionStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProcessionDto } from './create-procession.dto';

export class UpdateProcessionDto extends PartialType(CreateProcessionDto) {
  @ApiPropertyOptional({ enum: ProcessionStatus })
  @IsOptional()
  @IsEnum(ProcessionStatus)
  status?: ProcessionStatus;
}
