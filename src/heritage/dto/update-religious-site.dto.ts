import { PartialType } from '@nestjs/swagger';
import { CreateReligiousSiteDto } from './create-religious-site.dto';

export class UpdateReligiousSiteDto extends PartialType(
  CreateReligiousSiteDto,
) {}
