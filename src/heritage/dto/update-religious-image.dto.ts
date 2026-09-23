import { PartialType } from '@nestjs/swagger';
import { CreateReligiousImageDto } from './create-religious-image.dto';

export class UpdateReligiousImageDto extends PartialType(
  CreateReligiousImageDto,
) {}
