-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "business";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cms";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "geo";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "heritage";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "media";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "operations";

-- CreateEnum
CREATE TYPE "geo"."locality_type" AS ENUM ('BARRIO', 'VEREDA', 'CORREGIMIENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "heritage"."festival_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "heritage"."festival_edition_status" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "heritage"."role_subject_type" AS ENUM ('PROCESSIONAL_STEP', 'FESTIVAL', 'FESTIVAL_EDITION', 'EVENT', 'HISTORICAL_EVENT', 'RELIGIOUS_SITE');

-- CreateEnum
CREATE TYPE "heritage"."religious_site_type" AS ENUM ('IGLESIA', 'CAPILLA', 'PARROQUIA', 'CEMENTERIO', 'CONVENTO', 'SITIO_HISTORICO', 'PLAZA', 'OTRO');

-- CreateEnum
CREATE TYPE "heritage"."conservation_status" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'IN_RESTORATION');

-- CreateEnum
CREATE TYPE "heritage"."publication_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "heritage"."date_precision" AS ENUM ('EXACT', 'YEAR', 'DECADE', 'CIRCA', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "heritage"."historical_reliability" AS ENUM ('VERIFIED', 'PROBABLE', 'DISPUTED', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "heritage"."source_type" AS ENUM ('BOOK', 'NEWSPAPER', 'ACTA', 'PHOTO', 'INSTITUTIONAL_DOC', 'MANUSCRIPT', 'ARCHIVE', 'WEBSITE', 'ORAL_TESTIMONY', 'OTHER');

-- CreateEnum
CREATE TYPE "heritage"."sourceable_type" AS ENUM ('HISTORICAL_EVENT', 'PERSON', 'PROCESSIONAL_STEP', 'RELIGIOUS_IMAGE', 'EVENT', 'RELIGIOUS_SITE', 'DOCUMENT', 'FAMILY');

-- CreateEnum
CREATE TYPE "heritage"."rights_subject_type" AS ENUM ('MEDIA_ASSET', 'PROCESSIONAL_STEP', 'RELIGIOUS_IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "heritage"."rights_type" AS ENUM ('OWNED', 'LICENSED', 'PUBLIC_DOMAIN', 'PERMISSION_GRANTED', 'UNKNOWN_PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "heritage"."rights_permission_status" AS ENUM ('PENDING', 'GRANTED', 'DENIED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "operations"."procession_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "operations"."event_type" AS ENUM ('PROCESSION', 'MASS', 'CONFERENCE', 'CONCERT', 'EXHIBITION', 'CULTURAL_ACTIVITY', 'CHILDREN_ACTIVITY', 'TOURISM_ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "operations"."event_status" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "media"."media_type" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "media"."attachable_type" AS ENUM ('PROCESSIONAL_STEP', 'RELIGIOUS_IMAGE', 'EVENT', 'PERSON', 'ARTICLE', 'RELIGIOUS_SITE', 'FESTIVAL', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "media"."media_attachment_role" AS ENUM ('PRIMARY', 'GALLERY', 'THUMBNAIL', 'ATTACHMENT', 'COVER');

-- CreateEnum
CREATE TYPE "media"."document_type" AS ENUM ('BOOK', 'NEWSPAPER', 'ACTA', 'PHOTO', 'INSTITUTIONAL', 'PDF', 'MANUSCRIPT', 'ARCHIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "cms"."article_status" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "finance"."donation_campaign_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "finance"."donor_visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "finance"."donation_status" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "finance"."beneficiary_type" AS ENUM ('JUNTA', 'FESTIVAL', 'FESTIVAL_EDITION', 'PROCESSIONAL_STEP', 'EVENT', 'PROJECT');

-- CreateEnum
CREATE TYPE "finance"."payment_transaction_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "finance"."financial_category_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "business"."sponsorable_type" AS ENUM ('FESTIVAL', 'FESTIVAL_EDITION', 'EVENT', 'PROCESSIONAL_STEP', 'DONATION_CAMPAIGN');

-- CreateEnum
CREATE TYPE "business"."sponsorship_status" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "business"."business_status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "business"."business_contact_type" AS ENUM ('PHONE', 'WHATSAPP', 'EMAIL', 'WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "business"."subscription_plan" AS ENUM ('FREE', 'BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "business"."business_subscription_status" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "business"."campaign_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "business"."advertisement_type" AS ENUM ('BANNER', 'SPONSORSHIP', 'FEATURED', 'SPONSORED_POST');

-- CreateEnum
CREATE TYPE "audit"."audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PUBLISH', 'UNPUBLISH', 'PAYMENT', 'REFUND', 'OTHER');

-- CreateTable
CREATE TABLE "geo"."country" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "iso_code_2" CHAR(2) NOT NULL,
    "iso_code_3" CHAR(3) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo"."department" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "country_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "dane_code" VARCHAR(10),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo"."municipality" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "department_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "dane_code" VARCHAR(10),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo"."locality" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "municipality_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "geo"."locality_type" NOT NULL DEFAULT 'OTRO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" VARCHAR(180) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(30),
    "person_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."role" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."permission" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."user_role" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by_user_id" UUID,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "auth"."role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "auth"."session" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."refresh_token" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."password_reset_token" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."email_verification" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."festival" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "municipality_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "short_description" VARCHAR(280),
    "description" TEXT,
    "historical_description" TEXT,
    "start_month" SMALLINT,
    "end_month" SMALLINT,
    "status" "heritage"."festival_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "festival_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."festival_edition" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_id" UUID NOT NULL,
    "year" SMALLINT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "official_program_url" VARCHAR(500),
    "status" "heritage"."festival_edition_status" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "festival_edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."role_type" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."person" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "display_name" VARCHAR(200) NOT NULL,
    "birth_date" DATE,
    "death_date" DATE,
    "biography_text" TEXT,
    "is_historical_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."family" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."family_person" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "family_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "relationship_note" VARCHAR(200),
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."person_role_assignment" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "person_id" UUID NOT NULL,
    "role_type_id" UUID NOT NULL,
    "subject_type" "heritage"."role_subject_type" NOT NULL,
    "subject_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "notes" TEXT,
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "person_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."religious_site" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "municipality_id" UUID NOT NULL,
    "type" "heritage"."religious_site_type" NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "address" VARCHAR(255),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "description" TEXT,
    "history" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "religious_site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."processional_step" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "history_text" TEXT,
    "origin_year" SMALLINT,
    "provenance" VARCHAR(255),
    "conservation_status" "heritage"."conservation_status" NOT NULL DEFAULT 'GOOD',
    "incorporated_at" DATE,
    "processional_order" SMALLINT,
    "primary_media_asset_id" UUID,
    "status" "heritage"."publication_status" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "processional_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."religious_image" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "processional_step_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "author" VARCHAR(160),
    "sculptor" VARCHAR(160),
    "provenance" VARCHAR(255),
    "approx_year" SMALLINT,
    "date_note" VARCHAR(160),
    "material" VARCHAR(160),
    "dimensions" VARCHAR(160),
    "weight_kg" DECIMAL(6,2),
    "conservation_status" "heritage"."conservation_status" NOT NULL DEFAULT 'GOOD',
    "restorations_note" TEXT,
    "location" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "religious_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."historical_period" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "start_year" SMALLINT,
    "end_year" SMALLINT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."historical_event" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_id" UUID,
    "period_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "event_date" DATE,
    "date_precision" "heritage"."date_precision" NOT NULL DEFAULT 'UNKNOWN',
    "description" TEXT,
    "content" TEXT,
    "reliability_level" "heritage"."historical_reliability" NOT NULL DEFAULT 'PROBABLE',
    "editorial_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "historical_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."source" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "title" VARCHAR(255) NOT NULL,
    "author" VARCHAR(200),
    "publisher" VARCHAR(200),
    "publication_date" DATE,
    "url" VARCHAR(500),
    "isbn" VARCHAR(20),
    "archive_reference" VARCHAR(200),
    "source_type" "heritage"."source_type" NOT NULL,
    "reliability_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."content_source" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "source_id" UUID NOT NULL,
    "sourceable_type" "heritage"."sourceable_type" NOT NULL,
    "sourceable_id" UUID NOT NULL,
    "citation_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heritage"."content_rights" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "subject_type" "heritage"."rights_subject_type" NOT NULL,
    "subject_id" UUID NOT NULL,
    "owner" VARCHAR(200),
    "custodian" VARCHAR(200),
    "rights_type" "heritage"."rights_type" NOT NULL DEFAULT 'UNKNOWN_PENDING_VERIFICATION',
    "license" VARCHAR(160),
    "permission_status" "heritage"."rights_permission_status" NOT NULL DEFAULT 'PENDING',
    "permission_granted_at" DATE,
    "source_text" VARCHAR(255),
    "restrictions_note" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_rights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."procession" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_edition_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "start_time" TIME(0),
    "estimated_end_time" TIME(0),
    "start_location" VARCHAR(255),
    "end_location" VARCHAR(255),
    "order" SMALLINT,
    "status" "operations"."procession_status" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "procession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."procession_step" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "procession_id" UUID NOT NULL,
    "processional_step_id" UUID NOT NULL,
    "order" SMALLINT NOT NULL,
    "estimated_duration_minutes" SMALLINT,
    "notes" TEXT,

    CONSTRAINT "procession_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."procession_route" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "procession_id" UUID NOT NULL,
    "name" VARCHAR(160),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "procession_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."procession_route_point" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "route_id" UUID NOT NULL,
    "order" SMALLINT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "street_name" VARCHAR(200),
    "description" TEXT,

    CONSTRAINT "procession_route_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."event" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_edition_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "event_type" "operations"."event_type" NOT NULL,
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6),
    "religious_site_id" UUID,
    "location_text" VARCHAR(255),
    "capacity" INTEGER,
    "status" "operations"."event_status" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."event_step" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "event_id" UUID NOT NULL,
    "processional_step_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "event_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations"."event_organization" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "event_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" VARCHAR(80),
    "notes" TEXT,

    CONSTRAINT "event_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."media_asset" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" "media"."media_type" NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "storage_provider" VARCHAR(60) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "checksum" VARCHAR(128),
    "metadata" JSONB,
    "uploaded_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."media_attachment" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "media_asset_id" UUID NOT NULL,
    "attachable_type" "media"."attachable_type" NOT NULL,
    "attachable_id" UUID NOT NULL,
    "role" "media"."media_attachment_role" NOT NULL DEFAULT 'GALLERY',
    "order" SMALLINT NOT NULL DEFAULT 0,
    "caption" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."gallery" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "festival_edition_id" UUID,
    "cover_media_asset_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."gallery_item" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "gallery_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "caption" VARCHAR(255),

    CONSTRAINT "gallery_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."document" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "title" VARCHAR(255) NOT NULL,
    "type" "media"."document_type" NOT NULL,
    "description" TEXT,
    "publication_date" DATE,
    "media_asset_id" UUID,
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media"."document_version" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "document_id" UUID NOT NULL,
    "version_number" SMALLINT NOT NULL,
    "changed_by_user_id" UUID,
    "change_summary" VARCHAR(255),
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms"."article_category" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "description" TEXT,

    CONSTRAINT "article_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms"."tag" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms"."article" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_id" UUID,
    "category_id" UUID,
    "author_user_id" UUID,
    "title" VARCHAR(220) NOT NULL,
    "slug" VARCHAR(240) NOT NULL,
    "excerpt" VARCHAR(400),
    "content" TEXT NOT NULL,
    "status" "cms"."article_status" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "cover_media_asset_id" UUID,
    "meta_title" VARCHAR(70),
    "meta_description" VARCHAR(160),
    "canonical_url" VARCHAR(500),
    "social_image_media_asset_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms"."article_version" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "article_id" UUID NOT NULL,
    "version_number" SMALLINT NOT NULL,
    "edited_by_user_id" UUID,
    "title" VARCHAR(220) NOT NULL,
    "content" TEXT NOT NULL,
    "change_summary" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms"."article_tag" (
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "article_tag_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "finance"."donation_campaign" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "festival_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "goal_amount" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "start_date" DATE,
    "end_date" DATE,
    "status" "finance"."donation_campaign_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "donation_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."donation" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "campaign_id" UUID,
    "donor_person_id" UUID,
    "donor_name_snapshot" VARCHAR(200),
    "donor_email" VARCHAR(180),
    "donor_visibility" "finance"."donor_visibility" NOT NULL DEFAULT 'PRIVATE',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "status" "finance"."donation_status" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."donation_allocation" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "donation_id" UUID NOT NULL,
    "beneficiary_type" "finance"."beneficiary_type" NOT NULL,
    "beneficiary_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "percentage" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."donation_status_history" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "donation_id" UUID NOT NULL,
    "from_status" "finance"."donation_status",
    "to_status" "finance"."donation_status" NOT NULL,
    "changed_by_user_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."donation_receipt" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "donation_id" UUID NOT NULL,
    "receipt_number" VARCHAR(40) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_media_asset_id" UUID,
    "tax_id_snapshot" VARCHAR(40),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."payment_provider" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."payment_transaction" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "donation_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "external_transaction_id" VARCHAR(120),
    "status" "finance"."payment_transaction_status" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "payment_method_type" VARCHAR(60),
    "paid_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."financial_category" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(120) NOT NULL,
    "type" "finance"."financial_category_type" NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."financial_transaction" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "category_id" UUID NOT NULL,
    "type" "finance"."financial_category_type" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "description" TEXT,
    "related_donation_id" UUID,
    "related_campaign_id" UUID,
    "occurred_at" DATE NOT NULL,
    "created_by_user_id" UUID,
    "reversal_of_transaction_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."financial_report" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "campaign_id" UUID,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_income" DECIMAL(14,2) NOT NULL,
    "total_expense" DECIMAL(14,2) NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by_user_id" UUID,

    CONSTRAINT "financial_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."organization_type" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,

    CONSTRAINT "organization_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."organization" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "tax_id" VARCHAR(40),
    "contact_email" VARCHAR(180),
    "contact_phone" VARCHAR(30),
    "website" VARCHAR(255),
    "logo_media_asset_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."sponsorship_package" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "benefits" JSONB,

    CONSTRAINT "sponsorship_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."sponsorship" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "sponsorable_type" "business"."sponsorable_type" NOT NULL,
    "sponsorable_id" UUID NOT NULL,
    "package_id" UUID,
    "campaign_id" UUID,
    "amount" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "business"."sponsorship_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business_category" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,

    CONSTRAINT "business_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID,
    "category_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "logo_media_asset_id" UUID,
    "status" "business"."business_status" NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business_location" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "business_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business_contact" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "type" "business"."business_contact_type" NOT NULL,
    "value" VARCHAR(255) NOT NULL,

    CONSTRAINT "business_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."business_subscription" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "plan" "business"."subscription_plan" NOT NULL DEFAULT 'FREE',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "business"."business_subscription_status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "business_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."advertisement_campaign" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "budget" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'COP',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "business"."campaign_status" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "advertisement_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."advertisement" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "campaign_id" UUID NOT NULL,
    "type" "business"."advertisement_type" NOT NULL,
    "creative_media_asset_id" UUID,
    "target_url" VARCHAR(500),
    "status" "business"."campaign_status" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."advertisement_placement" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "advertisement_id" UUID NOT NULL,
    "placement_zone" VARCHAR(80) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "clicks" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "advertisement_placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_log" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID,
    "action" "audit"."audit_action" NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso_code_2_key" ON "geo"."country"("iso_code_2");

-- CreateIndex
CREATE UNIQUE INDEX "country_iso_code_3_key" ON "geo"."country"("iso_code_3");

-- CreateIndex
CREATE INDEX "department_country_id_idx" ON "geo"."department"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_country_id_name_key" ON "geo"."department"("country_id", "name");

-- CreateIndex
CREATE INDEX "municipality_department_id_idx" ON "geo"."municipality"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "municipality_department_id_name_key" ON "geo"."municipality"("department_id", "name");

-- CreateIndex
CREATE INDEX "locality_municipality_id_idx" ON "geo"."locality"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "locality_municipality_id_name_key" ON "geo"."locality"("municipality_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "auth"."user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "auth"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_code_key" ON "auth"."role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permission_code_key" ON "auth"."permission"("code");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "auth"."session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "auth"."refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "auth"."refresh_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_hash_key" ON "auth"."password_reset_token"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_token_user_id_idx" ON "auth"."password_reset_token"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_token_hash_key" ON "auth"."email_verification"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_user_id_idx" ON "auth"."email_verification"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "festival_slug_key" ON "heritage"."festival"("slug");

-- CreateIndex
CREATE INDEX "festival_municipality_id_idx" ON "heritage"."festival"("municipality_id");

-- CreateIndex
CREATE INDEX "festival_edition_festival_id_idx" ON "heritage"."festival_edition"("festival_id");

-- CreateIndex
CREATE UNIQUE INDEX "festival_edition_festival_id_year_key" ON "heritage"."festival_edition"("festival_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "role_type_code_key" ON "heritage"."role_type"("code");

-- CreateIndex
CREATE INDEX "person_last_name_first_name_idx" ON "heritage"."person"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "family_person_person_id_idx" ON "heritage"."family_person"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_person_family_id_person_id_key" ON "heritage"."family_person"("family_id", "person_id");

-- CreateIndex
CREATE INDEX "person_role_assignment_subject_type_subject_id_idx" ON "heritage"."person_role_assignment"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "person_role_assignment_person_id_idx" ON "heritage"."person_role_assignment"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "religious_site_slug_key" ON "heritage"."religious_site"("slug");

-- CreateIndex
CREATE INDEX "religious_site_municipality_id_idx" ON "heritage"."religious_site"("municipality_id");

-- CreateIndex
CREATE INDEX "processional_step_festival_id_idx" ON "heritage"."processional_step"("festival_id");

-- CreateIndex
CREATE UNIQUE INDEX "processional_step_festival_id_slug_key" ON "heritage"."processional_step"("festival_id", "slug");

-- CreateIndex
CREATE INDEX "religious_image_processional_step_id_idx" ON "heritage"."religious_image"("processional_step_id");

-- CreateIndex
CREATE UNIQUE INDEX "historical_period_slug_key" ON "heritage"."historical_period"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "historical_event_slug_key" ON "heritage"."historical_event"("slug");

-- CreateIndex
CREATE INDEX "historical_event_festival_id_idx" ON "heritage"."historical_event"("festival_id");

-- CreateIndex
CREATE INDEX "historical_event_period_id_idx" ON "heritage"."historical_event"("period_id");

-- CreateIndex
CREATE INDEX "content_source_sourceable_type_sourceable_id_idx" ON "heritage"."content_source"("sourceable_type", "sourceable_id");

-- CreateIndex
CREATE INDEX "content_source_source_id_idx" ON "heritage"."content_source"("source_id");

-- CreateIndex
CREATE INDEX "content_rights_subject_type_subject_id_idx" ON "heritage"."content_rights"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "procession_festival_edition_id_idx" ON "operations"."procession"("festival_edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "procession_step_procession_id_processional_step_id_key" ON "operations"."procession_step"("procession_id", "processional_step_id");

-- CreateIndex
CREATE UNIQUE INDEX "procession_step_procession_id_order_key" ON "operations"."procession_step"("procession_id", "order");

-- CreateIndex
CREATE INDEX "procession_route_procession_id_idx" ON "operations"."procession_route"("procession_id");

-- CreateIndex
CREATE UNIQUE INDEX "procession_route_point_route_id_order_key" ON "operations"."procession_route_point"("route_id", "order");

-- CreateIndex
CREATE INDEX "event_festival_edition_id_idx" ON "operations"."event"("festival_edition_id");

-- CreateIndex
CREATE INDEX "event_start_datetime_idx" ON "operations"."event"("start_datetime");

-- CreateIndex
CREATE UNIQUE INDEX "event_festival_edition_id_slug_key" ON "operations"."event"("festival_edition_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_step_event_id_processional_step_id_key" ON "operations"."event_step"("event_id", "processional_step_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_organization_event_id_organization_id_key" ON "operations"."event_organization"("event_id", "organization_id");

-- CreateIndex
CREATE INDEX "media_attachment_attachable_type_attachable_id_idx" ON "media"."media_attachment"("attachable_type", "attachable_id");

-- CreateIndex
CREATE INDEX "media_attachment_media_asset_id_idx" ON "media"."media_attachment"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_slug_key" ON "media"."gallery"("slug");

-- CreateIndex
CREATE INDEX "gallery_festival_edition_id_idx" ON "media"."gallery"("festival_edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_item_gallery_id_media_asset_id_key" ON "media"."gallery_item"("gallery_id", "media_asset_id");

-- CreateIndex
CREATE INDEX "document_source_id_idx" ON "media"."document"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_version_document_id_version_number_key" ON "media"."document_version"("document_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "article_category_slug_key" ON "cms"."article_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "cms"."tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "cms"."article"("slug");

-- CreateIndex
CREATE INDEX "article_festival_id_idx" ON "cms"."article"("festival_id");

-- CreateIndex
CREATE INDEX "article_status_published_at_idx" ON "cms"."article"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "article_version_article_id_version_number_key" ON "cms"."article_version"("article_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "donation_campaign_slug_key" ON "finance"."donation_campaign"("slug");

-- CreateIndex
CREATE INDEX "donation_campaign_festival_id_idx" ON "finance"."donation_campaign"("festival_id");

-- CreateIndex
CREATE INDEX "donation_campaign_id_idx" ON "finance"."donation"("campaign_id");

-- CreateIndex
CREATE INDEX "donation_donor_person_id_idx" ON "finance"."donation"("donor_person_id");

-- CreateIndex
CREATE INDEX "donation_status_created_at_idx" ON "finance"."donation"("status", "created_at");

-- CreateIndex
CREATE INDEX "donation_allocation_donation_id_idx" ON "finance"."donation_allocation"("donation_id");

-- CreateIndex
CREATE INDEX "donation_allocation_beneficiary_type_beneficiary_id_idx" ON "finance"."donation_allocation"("beneficiary_type", "beneficiary_id");

-- CreateIndex
CREATE INDEX "donation_status_history_donation_id_idx" ON "finance"."donation_status_history"("donation_id");

-- CreateIndex
CREATE UNIQUE INDEX "donation_receipt_donation_id_key" ON "finance"."donation_receipt"("donation_id");

-- CreateIndex
CREATE UNIQUE INDEX "donation_receipt_receipt_number_key" ON "finance"."donation_receipt"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_code_key" ON "finance"."payment_provider"("code");

-- CreateIndex
CREATE INDEX "payment_transaction_donation_id_idx" ON "finance"."payment_transaction"("donation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_provider_id_external_transaction_id_key" ON "finance"."payment_transaction"("provider_id", "external_transaction_id");

-- CreateIndex
CREATE INDEX "financial_transaction_category_id_idx" ON "finance"."financial_transaction"("category_id");

-- CreateIndex
CREATE INDEX "financial_transaction_occurred_at_idx" ON "finance"."financial_transaction"("occurred_at");

-- CreateIndex
CREATE INDEX "financial_transaction_related_campaign_id_idx" ON "finance"."financial_transaction"("related_campaign_id");

-- CreateIndex
CREATE INDEX "financial_report_campaign_id_idx" ON "finance"."financial_report"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_type_code_key" ON "business"."organization_type"("code");

-- CreateIndex
CREATE INDEX "organization_type_id_idx" ON "business"."organization"("type_id");

-- CreateIndex
CREATE INDEX "sponsorship_sponsorable_type_sponsorable_id_idx" ON "business"."sponsorship"("sponsorable_type", "sponsorable_id");

-- CreateIndex
CREATE INDEX "sponsorship_organization_id_idx" ON "business"."sponsorship"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_category_slug_key" ON "business"."business_category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_slug_key" ON "business"."business"("slug");

-- CreateIndex
CREATE INDEX "business_category_id_idx" ON "business"."business"("category_id");

-- CreateIndex
CREATE INDEX "business_location_business_id_idx" ON "business"."business_location"("business_id");

-- CreateIndex
CREATE INDEX "business_location_municipality_id_idx" ON "business"."business_location"("municipality_id");

-- CreateIndex
CREATE INDEX "business_contact_business_id_idx" ON "business"."business_contact"("business_id");

-- CreateIndex
CREATE INDEX "business_subscription_business_id_idx" ON "business"."business_subscription"("business_id");

-- CreateIndex
CREATE INDEX "advertisement_campaign_organization_id_idx" ON "business"."advertisement_campaign"("organization_id");

-- CreateIndex
CREATE INDEX "advertisement_campaign_id_idx" ON "business"."advertisement"("campaign_id");

-- CreateIndex
CREATE INDEX "advertisement_placement_advertisement_id_idx" ON "business"."advertisement_placement"("advertisement_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit"."audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_user_id_created_at_idx" ON "audit"."audit_log"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "geo"."department" ADD CONSTRAINT "department_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "geo"."country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo"."municipality" ADD CONSTRAINT "municipality_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "geo"."department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo"."locality" ADD CONSTRAINT "locality_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "geo"."municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth"."permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."email_verification" ADD CONSTRAINT "email_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."festival_edition" ADD CONSTRAINT "festival_edition_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "heritage"."festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."family_person" ADD CONSTRAINT "family_person_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "heritage"."family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."family_person" ADD CONSTRAINT "family_person_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "heritage"."person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."family_person" ADD CONSTRAINT "family_person_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "heritage"."source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."person_role_assignment" ADD CONSTRAINT "person_role_assignment_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "heritage"."person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."person_role_assignment" ADD CONSTRAINT "person_role_assignment_role_type_id_fkey" FOREIGN KEY ("role_type_id") REFERENCES "heritage"."role_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."person_role_assignment" ADD CONSTRAINT "person_role_assignment_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "heritage"."source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."processional_step" ADD CONSTRAINT "processional_step_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "heritage"."festival"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."religious_image" ADD CONSTRAINT "religious_image_processional_step_id_fkey" FOREIGN KEY ("processional_step_id") REFERENCES "heritage"."processional_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."historical_event" ADD CONSTRAINT "historical_event_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "heritage"."festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."historical_event" ADD CONSTRAINT "historical_event_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "heritage"."historical_period"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."content_source" ADD CONSTRAINT "content_source_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "heritage"."source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."procession" ADD CONSTRAINT "procession_festival_edition_id_fkey" FOREIGN KEY ("festival_edition_id") REFERENCES "heritage"."festival_edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."procession_step" ADD CONSTRAINT "procession_step_procession_id_fkey" FOREIGN KEY ("procession_id") REFERENCES "operations"."procession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."procession_step" ADD CONSTRAINT "procession_step_processional_step_id_fkey" FOREIGN KEY ("processional_step_id") REFERENCES "heritage"."processional_step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."procession_route" ADD CONSTRAINT "procession_route_procession_id_fkey" FOREIGN KEY ("procession_id") REFERENCES "operations"."procession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."procession_route_point" ADD CONSTRAINT "procession_route_point_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "operations"."procession_route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."event" ADD CONSTRAINT "event_festival_edition_id_fkey" FOREIGN KEY ("festival_edition_id") REFERENCES "heritage"."festival_edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."event" ADD CONSTRAINT "event_religious_site_id_fkey" FOREIGN KEY ("religious_site_id") REFERENCES "heritage"."religious_site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."event_step" ADD CONSTRAINT "event_step_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "operations"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."event_step" ADD CONSTRAINT "event_step_processional_step_id_fkey" FOREIGN KEY ("processional_step_id") REFERENCES "heritage"."processional_step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."event_organization" ADD CONSTRAINT "event_organization_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "operations"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations"."event_organization" ADD CONSTRAINT "event_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "business"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."media_attachment" ADD CONSTRAINT "media_attachment_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media"."media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."gallery" ADD CONSTRAINT "gallery_festival_edition_id_fkey" FOREIGN KEY ("festival_edition_id") REFERENCES "heritage"."festival_edition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."gallery_item" ADD CONSTRAINT "gallery_item_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "media"."gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."gallery_item" ADD CONSTRAINT "gallery_item_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media"."media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."document" ADD CONSTRAINT "document_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."document" ADD CONSTRAINT "document_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "heritage"."source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media"."document_version" ADD CONSTRAINT "document_version_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "media"."document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms"."article" ADD CONSTRAINT "article_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "heritage"."festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms"."article" ADD CONSTRAINT "article_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cms"."article_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms"."article_version" ADD CONSTRAINT "article_version_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "cms"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms"."article_tag" ADD CONSTRAINT "article_tag_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "cms"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms"."article_tag" ADD CONSTRAINT "article_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "cms"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."donation_campaign" ADD CONSTRAINT "donation_campaign_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "heritage"."festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."donation" ADD CONSTRAINT "donation_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "finance"."donation_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."donation" ADD CONSTRAINT "donation_donor_person_id_fkey" FOREIGN KEY ("donor_person_id") REFERENCES "heritage"."person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."donation_allocation" ADD CONSTRAINT "donation_allocation_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "finance"."donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."donation_status_history" ADD CONSTRAINT "donation_status_history_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "finance"."donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."donation_receipt" ADD CONSTRAINT "donation_receipt_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "finance"."donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."payment_transaction" ADD CONSTRAINT "payment_transaction_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "finance"."donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."payment_transaction" ADD CONSTRAINT "payment_transaction_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "finance"."payment_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."financial_category" ADD CONSTRAINT "financial_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "finance"."financial_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."financial_transaction" ADD CONSTRAINT "financial_transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "finance"."financial_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."financial_transaction" ADD CONSTRAINT "financial_transaction_reversal_of_transaction_id_fkey" FOREIGN KEY ("reversal_of_transaction_id") REFERENCES "finance"."financial_transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."organization" ADD CONSTRAINT "organization_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "business"."organization_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."sponsorship" ADD CONSTRAINT "sponsorship_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "business"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."sponsorship" ADD CONSTRAINT "sponsorship_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "business"."sponsorship_package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."sponsorship" ADD CONSTRAINT "sponsorship_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "finance"."donation_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business" ADD CONSTRAINT "business_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "business"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business" ADD CONSTRAINT "business_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "business"."business_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business_location" ADD CONSTRAINT "business_location_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"."business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business_contact" ADD CONSTRAINT "business_contact_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"."business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business_subscription" ADD CONSTRAINT "business_subscription_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"."business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."advertisement_campaign" ADD CONSTRAINT "advertisement_campaign_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "business"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."advertisement" ADD CONSTRAINT "advertisement_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "business"."advertisement_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."advertisement_placement" ADD CONSTRAINT "advertisement_placement_advertisement_id_fkey" FOREIGN KEY ("advertisement_id") REFERENCES "business"."advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
