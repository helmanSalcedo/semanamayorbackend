import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FestivalEditionStatus } from '@prisma/client';
import { CreateFestivalEditionDto } from './create-festival-edition.dto';

export class UpdateFestivalEditionDto extends PartialType(
  CreateFestivalEditionDto,
) {
  @ApiPropertyOptional({ enum: FestivalEditionStatus })
  @IsOptional()
  @IsEnum(FestivalEditionStatus)
  status?: FestivalEditionStatus;
}
