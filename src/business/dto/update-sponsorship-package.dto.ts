import { PartialType } from '@nestjs/swagger';
import { CreateSponsorshipPackageDto } from './create-sponsorship-package.dto';

export class UpdateSponsorshipPackageDto extends PartialType(
  CreateSponsorshipPackageDto,
) {}
