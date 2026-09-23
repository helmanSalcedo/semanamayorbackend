import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindHistoricalEventsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  festivalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  periodId?: string;
}
