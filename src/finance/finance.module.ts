import { Module } from '@nestjs/common';
import { DonationCampaignsController } from './donation-campaigns.controller';
import { DonationCampaignsService } from './donation-campaigns.service';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { PaymentTransactionsController } from './payment-transactions.controller';
import { PaymentTransactionsService } from './payment-transactions.service';
import { FinancialCategoriesController } from './financial-categories.controller';
import { FinancialCategoriesService } from './financial-categories.service';
import { FinancialTransactionsController } from './financial-transactions.controller';
import { FinancialTransactionsService } from './financial-transactions.service';
import { FinancialReportsController } from './financial-reports.controller';
import { FinancialReportsService } from './financial-reports.service';

@Module({
  controllers: [
    DonationCampaignsController,
    DonationsController,
    PaymentTransactionsController,
    FinancialCategoriesController,
    FinancialTransactionsController,
    FinancialReportsController,
  ],
  providers: [
    DonationCampaignsService,
    DonationsService,
    PaymentTransactionsService,
    FinancialCategoriesService,
    FinancialTransactionsService,
    FinancialReportsService,
  ],
})
export class FinanceModule {}
