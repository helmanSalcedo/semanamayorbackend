import { ApiProperty } from '@nestjs/swagger';
import { RightsSubjectType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class FindContentRightsDto {
  @ApiProperty({ enum: RightsSubjectType })
  @IsEnum(RightsSubjectType)
  subjectType!: RightsSubjectType;

  @ApiProperty()
  @IsUUID()
  subjectId!: string;
}
