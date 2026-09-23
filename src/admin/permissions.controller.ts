import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsService } from './permissions.service';

@ApiTags('admin')
@Controller('permissions')
@Permissions('role.manage')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista el catálogo de permisos disponibles' })
  findAll() {
    return this.permissionsService.findAll();
  }
}
