import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateProcessionalStepDto } from './dto/create-processional-step.dto';
import { UpdateProcessionalStepDto } from './dto/update-processional-step.dto';
import { ProcessionalStepsService } from './processional-steps.service';

@ApiTags('festivals')
@Controller('festivals/:festivalId/steps')
export class ProcessionalStepsController {
  constructor(private readonly stepsService: ProcessionalStepsService) {}

  @Post()
  @Permissions('processional_step.manage')
  @ApiOperation({ summary: 'Crea un paso procesional' })
  create(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Body() dto: CreateProcessionalStepDto,
  ) {
    return this.stepsService.create(festivalId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los pasos procesionales de una festividad' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.stepsService.findAllByFestival(festivalId, pagination);
  }

  @Public()
  @Get(':stepId')
  @ApiOperation({ summary: 'Detalle de un paso procesional' })
  findOne(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ) {
    return this.stepsService.findOne(festivalId, stepId);
  }

  @Patch(':stepId')
  @Permissions('processional_step.manage')
  @ApiOperation({ summary: 'Actualiza un paso procesional' })
  update(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateProcessionalStepDto,
  ) {
    return this.stepsService.update(festivalId, stepId, dto);
  }

  @Delete(':stepId')
  @Permissions('processional_step.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (soft-delete) un paso procesional' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<void> {
    await this.stepsService.remove(festivalId, stepId);
  }
}
