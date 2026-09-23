import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'persona@example.com' })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Contrasena-Segura1' })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // límite práctico de argon2/bcrypt sobre bytes de entrada
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúscula, minúscula y número',
  })
  password!: string;

  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @ApiProperty({ required: false, example: '+57 300 000 0000' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
