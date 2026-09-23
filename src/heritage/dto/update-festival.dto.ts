import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FestivalStatus } from '@prisma/client';
import { CreateFestivalDto } from './create-festival.dto';

export class UpdateFestivalDto extends PartialType(CreateFestivalDto) {
  @ApiPropertyOptional({ enum: FestivalStatus })
  @IsOptional()
  @IsEnum(FestivalStatus)
  status?: FestivalStatus;
}
