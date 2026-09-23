import { Module } from '@nestjs/common';
import { HeritageModule } from '../heritage/heritage.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ProcessionsController } from './processions.controller';
import { ProcessionsService } from './processions.service';
import { ProcessionLineupController } from './procession-lineup.controller';
import { ProcessionLineupService } from './procession-lineup.service';
import { ProcessionRoutesController } from './procession-routes.controller';
import { ProcessionRoutesService } from './procession-routes.service';
import { RoutePointsController } from './route-points.controller';
import { RoutePointsService } from './route-points.service';
import { EventStepsController } from './event-steps.controller';
import { EventStepsService } from './event-steps.service';
import { EventOrganizationsController } from './event-organizations.controller';
import { EventOrganizationsService } from './event-organizations.service';

@Module({
  imports: [HeritageModule],
  controllers: [
    EventsController,
    ProcessionsController,
    ProcessionLineupController,
    ProcessionRoutesController,
    RoutePointsController,
    EventStepsController,
    EventOrganizationsController,
  ],
  providers: [
    EventsService,
    ProcessionsService,
    ProcessionLineupService,
    ProcessionRoutesService,
    RoutePointsService,
    EventStepsService,
    EventOrganizationsService,
  ],
})
export class OperationsModule {}
