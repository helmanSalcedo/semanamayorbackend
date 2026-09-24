import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { BeneficiaryType, DonorIdType, DonorVisibility } from '@prisma/client';
import {
  ArrayMinSize,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { normalizeDonorIdNumber } from '../donor-id.util';

export class DonationAllocationInputDto {
  @ApiProperty({ enum: BeneficiaryType })
  @IsEnum(BeneficiaryType)
  beneficiaryType!: BeneficiaryType;

  @ApiPropertyOptional({
    description:
      'Requerido salvo para JUNTA/PROJECT (fondo general / proyecto ad-hoc en notes)',
  })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDonationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiPropertyOptional({
    description:
      'Vínculo opcional si el donante tiene ficha en heritage.Person',
  })
  @IsOptional()
  @IsUUID()
  donorPersonId?: string;

  @ApiPropertyOptional({ example: 'María Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  donorNameSnapshot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  donorEmail?: string;

  @ApiPropertyOptional({
    enum: DonorIdType,
    description:
      'Tipo de documento del donante, para que el recibo sirva como soporte tributario. Obligatorio si se envía donorIdNumber',
  })
  @ValidateIf((o: CreateDonationDto) => o.donorIdNumber !== undefined)
  @IsEnum(DonorIdType)
  donorIdType?: DonorIdType;

  @ApiPropertyOptional({
    example: '1.234.567',
    description:
      'Número de documento; se aceptan puntos y espacios (se normaliza). Obligatorio si se envía donorIdType',
  })
  @ValidateIf((o: CreateDonationDto) => o.donorIdType !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeDonorIdNumber(value) : value,
  )
  @IsString()
  @MaxLength(20)
  donorIdNumber?: string;

  @ApiPropertyOptional({
    enum: DonorVisibility,
    default: DonorVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(DonorVisibility)
  donorVisibility?: DonorVisibility;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ default: 'COP' })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [DonationAllocationInputDto],
    description:
      'Debe sumar exactamente `amount` — la DB lo valida al confirmar la transacción',
  })
  @ValidateNested({ each: true })
  @Type(() => DonationAllocationInputDto)
  @ArrayMinSize(1)
  allocations!: DonationAllocationInputDto[];
}
