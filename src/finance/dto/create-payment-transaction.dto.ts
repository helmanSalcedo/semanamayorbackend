import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTransactionStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePaymentTransactionDto {
  @ApiProperty({
    example: 'WOMPI',
    description: 'Código de un PaymentProvider (MANUAL, WOMPI, PAYU, EPAYCO)',
  })
  @IsString()
  @MaxLength(40)
  providerCode!: string;

  @ApiPropertyOptional({
    description:
      'Id de transacción del proveedor — obligatorio salvo pagos MANUAL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalTransactionId?: string;

  @ApiProperty({ enum: PaymentTransactionStatus })
  @IsEnum(PaymentTransactionStatus)
  status!: PaymentTransactionStatus;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ default: 'COP' })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiPropertyOptional({ example: 'credit_card' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  paymentMethodType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
