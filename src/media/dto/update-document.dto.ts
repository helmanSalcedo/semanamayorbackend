import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @ApiPropertyOptional({
    description: 'Se guarda en el historial de versiones del documento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeSummary?: string;
}
