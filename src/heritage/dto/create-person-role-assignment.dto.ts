import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleSubjectType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePersonRoleAssignmentDto {
  @ApiProperty()
  @IsUUID()
  personId!: string;

  @ApiProperty({
    description: 'Id de un RoleType existente (síndico, carguero, etc.)',
  })
  @IsUUID()
  roleTypeId!: string;

  @ApiProperty({ enum: RoleSubjectType })
  @IsEnum(RoleSubjectType)
  subjectType!: RoleSubjectType;

  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiPropertyOptional({ example: '2015-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2019-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fuente que documenta este rol (recomendado)',
  })
  @IsOptional()
  @IsUUID()
  sourceId?: string;
}
