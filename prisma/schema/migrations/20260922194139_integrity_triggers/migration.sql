-- Integridad referencial para las relaciones polimórficas del diseño
-- (ARCHITECTURE.md §J.1). Cada tabla *_type/*_id se valida con un trigger
-- BEFORE INSERT OR UPDATE que confirma que el id referenciado existe en la
-- tabla concreta correspondiente al valor de *_type. Esto cumple el mismo
-- papel que una FOREIGN KEY física, sin necesitar una tabla de unión por
-- cada par de entidades.

-- ── heritage.person_role_assignment ────────────────────────────────────────
CREATE OR REPLACE FUNCTION heritage.validate_person_role_assignment_subject()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.subject_type
    WHEN 'PROCESSIONAL_STEP' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.processional_step WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'person_role_assignment.subject_id % no existe en heritage.processional_step', NEW.subject_id;
      END IF;
    WHEN 'FESTIVAL' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.festival WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'person_role_assignment.subject_id % no existe en heritage.festival', NEW.subject_id;
      END IF;
    WHEN 'FESTIVAL_EDITION' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.festival_edition WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'person_role_assignment.subject_id % no existe en heritage.festival_edition', NEW.subject_id;
      END IF;
    WHEN 'EVENT' THEN
      IF NOT EXISTS (SELECT 1 FROM operations.event WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'person_role_assignment.subject_id % no existe en operations.event', NEW.subject_id;
      END IF;
    WHEN 'HISTORICAL_EVENT' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.historical_event WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'person_role_assignment.subject_id % no existe en heritage.historical_event', NEW.subject_id;
      END IF;
    WHEN 'RELIGIOUS_SITE' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.religious_site WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'person_role_assignment.subject_id % no existe en heritage.religious_site', NEW.subject_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'subject_type % no soportado en person_role_assignment', NEW.subject_type;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_person_role_assignment_subject
  BEFORE INSERT OR UPDATE OF subject_type, subject_id ON heritage.person_role_assignment
  FOR EACH ROW EXECUTE FUNCTION heritage.validate_person_role_assignment_subject();

-- ── heritage.content_source ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION heritage.validate_content_source_sourceable()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.sourceable_type
    WHEN 'HISTORICAL_EVENT' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.historical_event WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en heritage.historical_event', NEW.sourceable_id;
      END IF;
    WHEN 'PERSON' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.person WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en heritage.person', NEW.sourceable_id;
      END IF;
    WHEN 'PROCESSIONAL_STEP' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.processional_step WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en heritage.processional_step', NEW.sourceable_id;
      END IF;
    WHEN 'RELIGIOUS_IMAGE' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.religious_image WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en heritage.religious_image', NEW.sourceable_id;
      END IF;
    WHEN 'EVENT' THEN
      IF NOT EXISTS (SELECT 1 FROM operations.event WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en operations.event', NEW.sourceable_id;
      END IF;
    WHEN 'RELIGIOUS_SITE' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.religious_site WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en heritage.religious_site', NEW.sourceable_id;
      END IF;
    WHEN 'DOCUMENT' THEN
      IF NOT EXISTS (SELECT 1 FROM media.document WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en media.document', NEW.sourceable_id;
      END IF;
    WHEN 'FAMILY' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.family WHERE id = NEW.sourceable_id) THEN
        RAISE EXCEPTION 'content_source.sourceable_id % no existe en heritage.family', NEW.sourceable_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'sourceable_type % no soportado en content_source', NEW.sourceable_type;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_content_source_sourceable
  BEFORE INSERT OR UPDATE OF sourceable_type, sourceable_id ON heritage.content_source
  FOR EACH ROW EXECUTE FUNCTION heritage.validate_content_source_sourceable();

-- ── heritage.content_rights ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION heritage.validate_content_rights_subject()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.subject_type
    WHEN 'MEDIA_ASSET' THEN
      IF NOT EXISTS (SELECT 1 FROM media.media_asset WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'content_rights.subject_id % no existe en media.media_asset', NEW.subject_id;
      END IF;
    WHEN 'PROCESSIONAL_STEP' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.processional_step WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'content_rights.subject_id % no existe en heritage.processional_step', NEW.subject_id;
      END IF;
    WHEN 'RELIGIOUS_IMAGE' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.religious_image WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'content_rights.subject_id % no existe en heritage.religious_image', NEW.subject_id;
      END IF;
    WHEN 'DOCUMENT' THEN
      IF NOT EXISTS (SELECT 1 FROM media.document WHERE id = NEW.subject_id) THEN
        RAISE EXCEPTION 'content_rights.subject_id % no existe en media.document', NEW.subject_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'subject_type % no soportado en content_rights', NEW.subject_type;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_content_rights_subject
  BEFORE INSERT OR UPDATE OF subject_type, subject_id ON heritage.content_rights
  FOR EACH ROW EXECUTE FUNCTION heritage.validate_content_rights_subject();

-- ── media.media_attachment ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION media.validate_media_attachment_attachable()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.attachable_type
    WHEN 'PROCESSIONAL_STEP' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.processional_step WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en heritage.processional_step', NEW.attachable_id;
      END IF;
    WHEN 'RELIGIOUS_IMAGE' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.religious_image WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en heritage.religious_image', NEW.attachable_id;
      END IF;
    WHEN 'EVENT' THEN
      IF NOT EXISTS (SELECT 1 FROM operations.event WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en operations.event', NEW.attachable_id;
      END IF;
    WHEN 'PERSON' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.person WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en heritage.person', NEW.attachable_id;
      END IF;
    WHEN 'ARTICLE' THEN
      IF NOT EXISTS (SELECT 1 FROM cms.article WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en cms.article', NEW.attachable_id;
      END IF;
    WHEN 'RELIGIOUS_SITE' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.religious_site WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en heritage.religious_site', NEW.attachable_id;
      END IF;
    WHEN 'FESTIVAL' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.festival WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en heritage.festival', NEW.attachable_id;
      END IF;
    WHEN 'DOCUMENT' THEN
      IF NOT EXISTS (SELECT 1 FROM media.document WHERE id = NEW.attachable_id) THEN
        RAISE EXCEPTION 'media_attachment.attachable_id % no existe en media.document', NEW.attachable_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'attachable_type % no soportado en media_attachment', NEW.attachable_type;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_media_attachment_attachable
  BEFORE INSERT OR UPDATE OF attachable_type, attachable_id ON media.media_attachment
  FOR EACH ROW EXECUTE FUNCTION media.validate_media_attachment_attachable();

-- ── finance.donation_allocation ─────────────────────────────────────────────
-- JUNTA y PROJECT no tienen tabla propia (fondo general / proyecto ad-hoc
-- descrito en `notes`), por lo que no se valida existencia para esos casos.
CREATE OR REPLACE FUNCTION finance.validate_donation_allocation_beneficiary()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.beneficiary_type
    WHEN 'JUNTA' THEN
      NULL;
    WHEN 'PROJECT' THEN
      NULL;
    WHEN 'FESTIVAL' THEN
      IF NEW.beneficiary_id IS NULL OR NOT EXISTS (SELECT 1 FROM heritage.festival WHERE id = NEW.beneficiary_id) THEN
        RAISE EXCEPTION 'donation_allocation.beneficiary_id % no existe en heritage.festival', NEW.beneficiary_id;
      END IF;
    WHEN 'FESTIVAL_EDITION' THEN
      IF NEW.beneficiary_id IS NULL OR NOT EXISTS (SELECT 1 FROM heritage.festival_edition WHERE id = NEW.beneficiary_id) THEN
        RAISE EXCEPTION 'donation_allocation.beneficiary_id % no existe en heritage.festival_edition', NEW.beneficiary_id;
      END IF;
    WHEN 'PROCESSIONAL_STEP' THEN
      IF NEW.beneficiary_id IS NULL OR NOT EXISTS (SELECT 1 FROM heritage.processional_step WHERE id = NEW.beneficiary_id) THEN
        RAISE EXCEPTION 'donation_allocation.beneficiary_id % no existe en heritage.processional_step', NEW.beneficiary_id;
      END IF;
    WHEN 'EVENT' THEN
      IF NEW.beneficiary_id IS NULL OR NOT EXISTS (SELECT 1 FROM operations.event WHERE id = NEW.beneficiary_id) THEN
        RAISE EXCEPTION 'donation_allocation.beneficiary_id % no existe en operations.event', NEW.beneficiary_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'beneficiary_type % no soportado en donation_allocation', NEW.beneficiary_type;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_donation_allocation_beneficiary
  BEFORE INSERT OR UPDATE OF beneficiary_type, beneficiary_id ON finance.donation_allocation
  FOR EACH ROW EXECUTE FUNCTION finance.validate_donation_allocation_beneficiary();

-- ── business.sponsorship ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION business.validate_sponsorship_sponsorable()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.sponsorable_type
    WHEN 'FESTIVAL' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.festival WHERE id = NEW.sponsorable_id) THEN
        RAISE EXCEPTION 'sponsorship.sponsorable_id % no existe en heritage.festival', NEW.sponsorable_id;
      END IF;
    WHEN 'FESTIVAL_EDITION' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.festival_edition WHERE id = NEW.sponsorable_id) THEN
        RAISE EXCEPTION 'sponsorship.sponsorable_id % no existe en heritage.festival_edition', NEW.sponsorable_id;
      END IF;
    WHEN 'EVENT' THEN
      IF NOT EXISTS (SELECT 1 FROM operations.event WHERE id = NEW.sponsorable_id) THEN
        RAISE EXCEPTION 'sponsorship.sponsorable_id % no existe en operations.event', NEW.sponsorable_id;
      END IF;
    WHEN 'PROCESSIONAL_STEP' THEN
      IF NOT EXISTS (SELECT 1 FROM heritage.processional_step WHERE id = NEW.sponsorable_id) THEN
        RAISE EXCEPTION 'sponsorship.sponsorable_id % no existe en heritage.processional_step', NEW.sponsorable_id;
      END IF;
    WHEN 'DONATION_CAMPAIGN' THEN
      IF NOT EXISTS (SELECT 1 FROM finance.donation_campaign WHERE id = NEW.sponsorable_id) THEN
        RAISE EXCEPTION 'sponsorship.sponsorable_id % no existe en finance.donation_campaign', NEW.sponsorable_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'sponsorable_type % no soportado en sponsorship', NEW.sponsorable_type;
  END CASE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_sponsorship_sponsorable
  BEFORE INSERT OR UPDATE OF sponsorable_type, sponsorable_id ON business.sponsorship
  FOR EACH ROW EXECUTE FUNCTION business.validate_sponsorship_sponsorable();
