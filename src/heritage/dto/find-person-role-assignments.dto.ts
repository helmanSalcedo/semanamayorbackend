import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleSubjectType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class FindPersonRoleAssignmentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  personId?: string;

  @ApiPropertyOptional({ enum: RoleSubjectType })
  @IsOptional()
  @IsEnum(RoleSubjectType)
  subjectType?: RoleSubjectType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;
}
