import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SponsorableType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSponsorshipDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ enum: SponsorableType })
  @IsEnum(SponsorableType)
  sponsorableType!: SponsorableType;

  @ApiProperty({
    description: 'ID de la entidad patrocinada (según sponsorableType)',
  })
  @IsUUID()
  sponsorableId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ default: 'COP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-04-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
