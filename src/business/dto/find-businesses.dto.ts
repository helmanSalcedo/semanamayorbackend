import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindBusinessesDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: BusinessStatus,
    description: 'Solo disponible en el listado de gestión',
  })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;
}
