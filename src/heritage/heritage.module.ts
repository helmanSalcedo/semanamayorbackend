import { Module } from '@nestjs/common';
import { FestivalsController } from './festivals.controller';
import { FestivalsService } from './festivals.service';
import { FestivalEditionsController } from './festival-editions.controller';
import { FestivalEditionsService } from './festival-editions.service';
import { ProcessionalStepsController } from './processional-steps.controller';
import { ProcessionalStepsService } from './processional-steps.service';
import { ReligiousImagesController } from './religious-images.controller';
import { ReligiousImagesService } from './religious-images.service';
import { ReligiousSitesController } from './religious-sites.controller';
import { ReligiousSitesService } from './religious-sites.service';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { ContentSourcesController } from './content-sources.controller';
import { ContentSourcesService } from './content-sources.service';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { PersonRoleAssignmentsController } from './person-role-assignments.controller';
import { PersonRoleAssignmentsService } from './person-role-assignments.service';
import { HistoricalPeriodsController } from './historical-periods.controller';
import { HistoricalPeriodsService } from './historical-periods.service';
import { HistoricalEventsController } from './historical-events.controller';
import { HistoricalEventsService } from './historical-events.service';
import { ContentRightsController } from './content-rights.controller';
import { ContentRightsService } from './content-rights.service';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { FamilyMembersController } from './family-members.controller';
import { FamilyMembersService } from './family-members.service';
import { RoleTypesController } from './role-types.controller';

@Module({
  controllers: [
    FestivalsController,
    FestivalEditionsController,
    ProcessionalStepsController,
    ReligiousImagesController,
    ReligiousSitesController,
    SourcesController,
    ContentSourcesController,
    PeopleController,
    PersonRoleAssignmentsController,
    HistoricalPeriodsController,
    HistoricalEventsController,
    ContentRightsController,
    FamiliesController,
    FamilyMembersController,
    RoleTypesController,
  ],
  providers: [
    FestivalsService,
    FestivalEditionsService,
    ProcessionalStepsService,
    ReligiousImagesService,
    ReligiousSitesService,
    SourcesService,
    ContentSourcesService,
    PeopleService,
    PersonRoleAssignmentsService,
    HistoricalPeriodsService,
    HistoricalEventsService,
    ContentRightsService,
    FamiliesService,
    FamilyMembersService,
  ],
  exports: [
    FestivalsService,
    FestivalEditionsService,
    ProcessionalStepsService,
  ],
})
export class HeritageModule {}
