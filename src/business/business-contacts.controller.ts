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
import { BusinessContactsService } from './business-contacts.service';
import { CreateBusinessContactDto } from './dto/create-business-contact.dto';

@ApiTags('business')
@Controller('businesses/:businessId/contacts')
export class BusinessContactsController {
  constructor(private readonly contactsService: BusinessContactsService) {}

  @Post()
  @Permissions('business.manage')
  @ApiOperation({ summary: 'Añade un contacto a un negocio' })
  add(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreateBusinessContactDto,
  ) {
    return this.contactsService.add(businessId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista los contactos de un negocio' })
  findAll(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.contactsService.findAll(businessId);
  }

  @Delete(':contactId')
  @Permissions('business.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un contacto' })
  async remove(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ): Promise<void> {
    await this.contactsService.remove(businessId, contactId);
  }
}
