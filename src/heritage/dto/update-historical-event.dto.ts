import { PartialType } from '@nestjs/swagger';
import { CreateHistoricalEventDto } from './create-historical-event.dto';

export class UpdateHistoricalEventDto extends PartialType(
  CreateHistoricalEventDto,
) {}
