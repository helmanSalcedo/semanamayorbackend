import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'María Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName?: string;

  @ApiPropertyOptional({ example: '+57 300 000 0000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
