import { ApiPropertyOptional } from '@nestjs/swagger';
import { SponsorableType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindSponsorshipsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ enum: SponsorableType })
  @IsOptional()
  @IsEnum(SponsorableType)
  sponsorableType?: SponsorableType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sponsorableId?: string;
}
