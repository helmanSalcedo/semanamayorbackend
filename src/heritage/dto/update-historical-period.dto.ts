import { PartialType } from '@nestjs/swagger';
import { CreateHistoricalPeriodDto } from './create-historical-period.dto';

export class UpdateHistoricalPeriodDto extends PartialType(
  CreateHistoricalPeriodDto,
) {}
