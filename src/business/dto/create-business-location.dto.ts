import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBusinessLocationDto {
  @ApiProperty()
  @IsUUID()
  municipalityId!: string;

  @ApiProperty({ example: 'Cra 5 # 10-20' })
  @IsString()
  @MaxLength(255)
  address!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
