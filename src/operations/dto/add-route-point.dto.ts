import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class AddRoutePointDto {
  @ApiProperty({
    description: 'Orden a lo largo del recorrido (único por ruta)',
  })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty()
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  streetName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
