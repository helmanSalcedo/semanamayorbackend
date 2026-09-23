import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RightsPermissionStatus,
  RightsSubjectType,
  RightsType,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateContentRightsDto {
  @ApiProperty({ enum: RightsSubjectType })
  @IsEnum(RightsSubjectType)
  subjectType!: RightsSubjectType;

  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  owner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  custodian?: string;

  @ApiPropertyOptional({
    enum: RightsType,
    default: RightsType.UNKNOWN_PENDING_VERIFICATION,
  })
  @IsOptional()
  @IsEnum(RightsType)
  rightsType?: RightsType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  license?: string;

  @ApiPropertyOptional({
    enum: RightsPermissionStatus,
    default: RightsPermissionStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RightsPermissionStatus)
  permissionStatus?: RightsPermissionStatus;

  @ApiPropertyOptional({ example: '2024-05-01' })
  @IsOptional()
  @IsDateString()
  permissionGrantedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restrictionsNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
