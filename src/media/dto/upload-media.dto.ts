import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UploadMediaDto {
  @ApiPropertyOptional({
    description:
      'Edición de festival a la que pertenece el archivo (ordena el storage como festivals/{slug}/{año}/{tipo}/...). Si se omite, va a general/{tipo}/...',
  })
  @IsOptional()
  @IsUUID()
  festivalEditionId?: string;
}
