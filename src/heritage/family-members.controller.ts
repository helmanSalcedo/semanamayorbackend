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
import { AddFamilyMemberDto } from './dto/add-family-member.dto';
import { FamilyMembersService } from './family-members.service';

@ApiTags('heritage')
@Controller('families/:familyId/members')
export class FamilyMembersController {
  constructor(private readonly familyMembersService: FamilyMembersService) {}

  @Post()
  @Permissions('person.manage')
  @ApiOperation({ summary: 'Vincula una persona a una familia' })
  add(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Body() dto: AddFamilyMemberDto,
  ) {
    return this.familyMembersService.add(familyId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los miembros de una familia' })
  findAll(@Param('familyId', ParseUUIDPipe) familyId: string) {
    return this.familyMembersService.findAll(familyId);
  }

  @Delete(':memberId')
  @Permissions('person.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Quita a una persona de la familia' })
  async remove(
    @Param('familyId', ParseUUIDPipe) familyId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    await this.familyMembersService.remove(familyId, memberId);
  }
}
