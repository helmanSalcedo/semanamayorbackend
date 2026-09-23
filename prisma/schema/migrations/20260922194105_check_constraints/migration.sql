-- CHECK constraints not expressible in the Prisma schema DSL.
-- These are hand-written (not generated from schema.prisma) and are safe to
-- keep across future `prisma migrate dev` runs: Prisma diffs against the
-- state produced by replaying all migrations, so it never tries to drop
-- constraints that aren't declared in schema.prisma but were added here.

-- ── Montos monetarios siempre positivos ────────────────────────────────────
ALTER TABLE "finance"."donation"
  ADD CONSTRAINT "donation_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "finance"."donation_allocation"
  ADD CONSTRAINT "donation_allocation_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "donation_allocation_percentage_range" CHECK ("percentage" IS NULL OR ("percentage" >= 0 AND "percentage" <= 100));

ALTER TABLE "finance"."payment_transaction"
  ADD CONSTRAINT "payment_transaction_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "finance"."donation_campaign"
  ADD CONSTRAINT "donation_campaign_goal_positive" CHECK ("goal_amount" IS NULL OR "goal_amount" > 0),
  ADD CONSTRAINT "donation_campaign_dates_order" CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date");

ALTER TABLE "finance"."financial_transaction"
  ADD CONSTRAINT "financial_transaction_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "finance"."financial_report"
  ADD CONSTRAINT "financial_report_totals_non_negative" CHECK ("total_income" >= 0 AND "total_expense" >= 0),
  ADD CONSTRAINT "financial_report_period_order" CHECK ("period_start" <= "period_end");

ALTER TABLE "business"."sponsorship"
  ADD CONSTRAINT "sponsorship_amount_positive" CHECK ("amount" IS NULL OR "amount" > 0),
  ADD CONSTRAINT "sponsorship_dates_order" CHECK ("end_date" IS NULL OR "start_date" <= "end_date");

ALTER TABLE "business"."sponsorship_package"
  ADD CONSTRAINT "sponsorship_package_price_positive" CHECK ("price" IS NULL OR "price" > 0);

ALTER TABLE "business"."advertisement_campaign"
  ADD CONSTRAINT "advertisement_campaign_budget_positive" CHECK ("budget" IS NULL OR "budget" > 0),
  ADD CONSTRAINT "advertisement_campaign_dates_order" CHECK ("end_date" IS NULL OR "start_date" <= "end_date");

ALTER TABLE "business"."advertisement_placement"
  ADD CONSTRAINT "advertisement_placement_dates_order" CHECK ("end_date" IS NULL OR "start_date" <= "end_date"),
  ADD CONSTRAINT "advertisement_placement_counters_non_negative" CHECK ("impressions" >= 0 AND "clicks" >= 0);

ALTER TABLE "business"."business_subscription"
  ADD CONSTRAINT "business_subscription_dates_order" CHECK ("end_date" IS NULL OR "start_date" <= "end_date");

-- ── Coordenadas geográficas válidas ─────────────────────────────────────────
ALTER TABLE "geo"."municipality"
  ADD CONSTRAINT "municipality_lat_range" CHECK ("latitude" IS NULL OR ("latitude" BETWEEN -90 AND 90)),
  ADD CONSTRAINT "municipality_lng_range" CHECK ("longitude" IS NULL OR ("longitude" BETWEEN -180 AND 180));

ALTER TABLE "heritage"."religious_site"
  ADD CONSTRAINT "religious_site_lat_range" CHECK ("latitude" IS NULL OR ("latitude" BETWEEN -90 AND 90)),
  ADD CONSTRAINT "religious_site_lng_range" CHECK ("longitude" IS NULL OR ("longitude" BETWEEN -180 AND 180));

ALTER TABLE "operations"."procession_route_point"
  ADD CONSTRAINT "route_point_lat_range" CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "route_point_lng_range" CHECK ("longitude" BETWEEN -180 AND 180);

ALTER TABLE "business"."business_location"
  ADD CONSTRAINT "business_location_lat_range" CHECK ("latitude" IS NULL OR ("latitude" BETWEEN -90 AND 90)),
  ADD CONSTRAINT "business_location_lng_range" CHECK ("longitude" IS NULL OR ("longitude" BETWEEN -180 AND 180));

-- ── Reglas de calendario/negocio ────────────────────────────────────────────
ALTER TABLE "heritage"."festival"
  ADD CONSTRAINT "festival_start_month_range" CHECK ("start_month" IS NULL OR ("start_month" BETWEEN 1 AND 12)),
  ADD CONSTRAINT "festival_end_month_range" CHECK ("end_month" IS NULL OR ("end_month" BETWEEN 1 AND 12));

ALTER TABLE "heritage"."festival_edition"
  ADD CONSTRAINT "festival_edition_dates_order" CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date"),
  ADD CONSTRAINT "festival_edition_year_range" CHECK ("year" BETWEEN 1900 AND 2200);

ALTER TABLE "operations"."event"
  ADD CONSTRAINT "event_dates_order" CHECK ("end_datetime" IS NULL OR "end_datetime" > "start_datetime");

ALTER TABLE "heritage"."person_role_assignment"
  ADD CONSTRAINT "person_role_assignment_dates_order" CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date");
