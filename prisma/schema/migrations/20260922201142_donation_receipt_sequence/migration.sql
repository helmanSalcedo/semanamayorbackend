-- ============================================================================
-- Migration: donation_receipt_sequence
-- Ver docs/database/ARCHITECTURE.md §C.6.
--
-- Genera donation_receipt.receipt_number atómicamente a partir de una
-- SEQUENCE de Postgres (no un stored procedure de negocio: solo un
-- consecutivo). Formato: REC-<año>-<consecutivo con padding>, ej. REC-2027-000042.
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS finance.donation_receipt_seq START 1;

CREATE OR REPLACE FUNCTION finance.next_donation_receipt_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'REC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('finance.donation_receipt_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "finance"."donation_receipt"
  ALTER COLUMN "receipt_number" SET DEFAULT finance.next_donation_receipt_number();
