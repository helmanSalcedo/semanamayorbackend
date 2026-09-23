import { Module } from '@nestjs/common';
import { AdTrackingController } from './ad-tracking.controller';
import { AdvertisementCampaignsController } from './advertisement-campaigns.controller';
import { AdvertisementCampaignsService } from './advertisement-campaigns.service';
import { AdvertisementPlacementsController } from './advertisement-placements.controller';
import { AdvertisementPlacementsService } from './advertisement-placements.service';
import { AdvertisementsController } from './advertisements.controller';
import { AdvertisementsService } from './advertisements.service';
import { BusinessCategoriesController } from './business-categories.controller';
import { BusinessContactsController } from './business-contacts.controller';
import { BusinessContactsService } from './business-contacts.service';
import { BusinessLocationsController } from './business-locations.controller';
import { BusinessLocationsService } from './business-locations.service';
import { BusinessSubscriptionsController } from './business-subscriptions.controller';
import { BusinessSubscriptionsService } from './business-subscriptions.service';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { OrganizationTypesController } from './organization-types.controller';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { SponsorshipPackagesController } from './sponsorship-packages.controller';
import { SponsorshipPackagesService } from './sponsorship-packages.service';
import { SponsorshipsController } from './sponsorships.controller';
import { SponsorshipsService } from './sponsorships.service';

@Module({
  controllers: [
    OrganizationsController,
    OrganizationTypesController,
    SponsorshipPackagesController,
    SponsorshipsController,
    BusinessCategoriesController,
    BusinessesController,
    BusinessLocationsController,
    BusinessContactsController,
    BusinessSubscriptionsController,
    AdvertisementCampaignsController,
    AdvertisementsController,
    AdvertisementPlacementsController,
    AdTrackingController,
  ],
  providers: [
    OrganizationsService,
    SponsorshipPackagesService,
    SponsorshipsService,
    BusinessesService,
    BusinessLocationsService,
    BusinessContactsService,
    BusinessSubscriptionsService,
    AdvertisementCampaignsService,
    AdvertisementsService,
    AdvertisementPlacementsService,
  ],
})
export class BusinessModule {}
