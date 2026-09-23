import { ApiProperty } from '@nestjs/swagger';
import { BusinessContactType } from '@prisma/client';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateBusinessContactDto {
  @ApiProperty({ enum: BusinessContactType })
  @IsEnum(BusinessContactType)
  type!: BusinessContactType;

  @ApiProperty({ example: '+57 300 000 0000' })
  @IsString()
  @MaxLength(255)
  value!: string;
}
