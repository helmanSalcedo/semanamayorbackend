import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'EDITOR_CONTENIDO',
    description: 'Identificador único, mayúsculas y guiones bajos',
  })
  @IsString()
  @MaxLength(60)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code debe ir en mayúsculas, ej. EDITOR_CONTENIDO',
  })
  code!: string;

  @ApiProperty({ example: 'Editor de contenido' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
