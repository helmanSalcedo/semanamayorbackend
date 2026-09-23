import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePersonRoleAssignmentDto } from './dto/create-person-role-assignment.dto';
import { FindPersonRoleAssignmentsDto } from './dto/find-person-role-assignments.dto';
import { PersonRoleAssignmentsService } from './person-role-assignments.service';

@ApiTags('people')
@Controller('person-role-assignments')
export class PersonRoleAssignmentsController {
  constructor(
    private readonly assignmentsService: PersonRoleAssignmentsService,
  ) {}

  @Post()
  @Permissions('person.manage')
  @ApiOperation({
    summary:
      'Asigna un rol cultural a una persona sobre una entidad (paso, festival, evento, etc.)',
  })
  create(@Body() dto: CreatePersonRoleAssignmentDto) {
    return this.assignmentsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Lista roles por persona o por entidad (personId, o subjectType+subjectId)',
  })
  find(@Query() query: FindPersonRoleAssignmentsDto) {
    return this.assignmentsService.find(query);
  }

  @Delete(':id')
  @Permissions('person.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita una asignación de rol' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.assignmentsService.remove(id);
  }
}
