import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [
    UsersController,
    RolesController,
    PermissionsController,
    AuditLogController,
  ],
  providers: [UsersService, RolesService, PermissionsService, AuditLogService],
})
export class AdminModule {}
