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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AddProcessionLineupItemDto } from './dto/add-procession-lineup-item.dto';
import { ProcessionLineupService } from './procession-lineup.service';

@ApiTags('operations')
@Controller(
  'festivals/:festivalId/editions/:editionId/processions/:processionId/steps',
)
export class ProcessionLineupController {
  constructor(private readonly lineupService: ProcessionLineupService) {}

  @Post()
  @Permissions('procession.manage')
  @ApiOperation({
    summary: 'Agrega un paso procesional al recorrido, con su orden',
  })
  add(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Body() dto: AddProcessionLineupItemDto,
  ) {
    return this.lineupService.add(festivalId, editionId, processionId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista el orden de pasos de una procesión' })
  findAll(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
  ) {
    return this.lineupService.findAll(festivalId, editionId, processionId);
  }

  @Delete(':itemId')
  @Permissions('procession.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita un paso del recorrido' })
  async remove(
    @Param('festivalId', ParseUUIDPipe) festivalId: string,
    @Param('editionId', ParseUUIDPipe) editionId: string,
    @Param('processionId', ParseUUIDPipe) processionId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<void> {
    await this.lineupService.remove(
      festivalId,
      editionId,
      processionId,
      itemId,
    );
  }
}
