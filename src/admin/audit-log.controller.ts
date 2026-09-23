import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditLogService } from './audit-log.service';
import { FindAuditLogDto } from './dto/find-audit-log.dto';

@ApiTags('admin')
@Controller('audit-log')
@Permissions('audit_log.read')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista el log de auditoría (filtrable por entidad, usuario, acción)',
  })
  findAll(@Query() query: FindAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}
