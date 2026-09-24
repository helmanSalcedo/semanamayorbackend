import { ApiProperty } from '@nestjs/swagger';
import { DonorIdType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { normalizeDonorIdNumber } from '../donor-id.util';

export class UpdateDonorDocumentDto {
  @ApiProperty({ enum: DonorIdType })
  @IsEnum(DonorIdType)
  donorIdType!: DonorIdType;

  @ApiProperty({
    example: '1.234.567',
    description: 'Se aceptan puntos y espacios (se normaliza)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeDonorIdNumber(value) : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  donorIdNumber!: string;
}
