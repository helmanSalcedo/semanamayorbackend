import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddFamilyMemberDto {
  @ApiProperty()
  @IsUUID()
  personId!: string;

  @ApiPropertyOptional({ example: 'Hijo mayor de...' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  relationshipNote?: string;

  @ApiPropertyOptional({
    description:
      'Fuente que respalda el parentesco. Opcional para un borrador de árbol genealógico en construcción, pero se exige antes de publicarlo como hecho verificado (ver HISTORICAL_MODEL.md § Familias)',
  })
  @IsOptional()
  @IsUUID()
  sourceId?: string;
}
