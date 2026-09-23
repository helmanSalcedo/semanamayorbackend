import { Module } from '@nestjs/common';
import { DonationCampaignsController } from './donation-campaigns.controller';
import { DonationCampaignsService } from './donation-campaigns.service';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { PaymentTransactionsController } from './payment-transactions.controller';
import { PaymentTransactionsService } from './payment-transactions.service';

@Module({
  controllers: [
    DonationCampaignsController,
    DonationsController,
    PaymentTransactionsController,
  ],
  providers: [
    DonationCampaignsService,
    DonationsService,
    PaymentTransactionsService,
  ],
})
export class FinanceModule {}
