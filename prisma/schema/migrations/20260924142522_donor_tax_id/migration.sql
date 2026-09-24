-- CreateEnum
CREATE TYPE "finance"."donor_id_type" AS ENUM ('CC', 'CE', 'NIT', 'PASSPORT', 'PPT');

-- AlterTable
ALTER TABLE "finance"."donation" ADD COLUMN     "donor_id_number" VARCHAR(20),
ADD COLUMN     "donor_id_type" "finance"."donor_id_type";

-- CHECK not expressible in the Prisma schema DSL: the donor's document is
-- all-or-nothing, so a receipt never carries a type without a number (or
-- the other way around).
ALTER TABLE "finance"."donation"
  ADD CONSTRAINT "donation_donor_id_complete"
  CHECK (("donor_id_type" IS NULL) = ("donor_id_number" IS NULL));
