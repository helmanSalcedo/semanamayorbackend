import { PartialType } from '@nestjs/swagger';
import { CreateContentRightsDto } from './create-content-rights.dto';

export class UpdateContentRightsDto extends PartialType(
  CreateContentRightsDto,
) {}
