import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BusinessSubscriptionsService } from './business-subscriptions.service';
import { CreateBusinessSubscriptionDto } from './dto/create-business-subscription.dto';
import { UpdateBusinessSubscriptionStatusDto } from './dto/update-business-subscription-status.dto';

@ApiTags('business')
@Controller('businesses/:businessId/subscriptions')
@Permissions('business.manage')
export class BusinessSubscriptionsController {
  constructor(
    private readonly subscriptionsService: BusinessSubscriptionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registra una suscripción para un negocio' })
  add(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Body() dto: CreateBusinessSubscriptionDto,
  ) {
    return this.subscriptionsService.add(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista las suscripciones de un negocio' })
  findAll(@Param('businessId', ParseUUIDPipe) businessId: string) {
    return this.subscriptionsService.findAll(businessId);
  }

  @Patch(':subscriptionId/status')
  @ApiOperation({ summary: 'Cambia el estado de una suscripción' })
  updateStatus(
    @Param('businessId', ParseUUIDPipe) businessId: string,
    @Param('subscriptionId', ParseUUIDPipe) subscriptionId: string,
    @Body() dto: UpdateBusinessSubscriptionStatusDto,
  ) {
    return this.subscriptionsService.updateStatus(
      businessId,
      subscriptionId,
      dto,
    );
  }
}
