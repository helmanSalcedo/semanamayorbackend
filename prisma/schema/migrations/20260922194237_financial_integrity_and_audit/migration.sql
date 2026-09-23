-- ============================================================================
-- Migration: financial_integrity_and_audit
-- Ver docs/database/FINANCIAL_MODEL.md y docs/database/AUDIT.md.
--
-- 1) Garantiza que SUM(donation_allocation.amount) nunca supere
--    donation.amount, incluso si la donacion se dividio en varias filas
--    dentro de la misma transaccion (constraint trigger DEFERRABLE:
--    se evalua al COMMIT, no fila por fila).
-- 2) Convierte finance.financial_transaction en un ledger append-only
--    (nunca UPDATE/DELETE; las correcciones son asientos de reversal).
-- 3) Impide DELETE fisico de donation / payment_transaction /
--    donation_receipt (seccion 29/51: nunca se eliminan, solo cambian
--    de estado via donation_status_history).
-- 4) Auditoria automatica: toda mutacion en tablas de donaciones/pagos
--    queda registrada en audit.audit_log sin depender de que el backend
--    "se acuerde" de auditar (seccion 28).
-- ============================================================================

-- ── 1) Guardia de suma de allocations ───────────────────────────────────────
CREATE OR REPLACE FUNCTION finance.check_donation_allocation_sum()
RETURNS TRIGGER AS $$
DECLARE
  v_donation_id UUID;
  v_total_amount NUMERIC(14,2);
  v_allocated_amount NUMERIC(14,2);
BEGIN
  v_donation_id := COALESCE(NEW.donation_id, OLD.donation_id);

  SELECT amount INTO v_total_amount FROM finance.donation WHERE id = v_donation_id;
  IF v_total_amount IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_allocated_amount
    FROM finance.donation_allocation WHERE donation_id = v_donation_id;

  IF v_allocated_amount > v_total_amount THEN
    RAISE EXCEPTION 'La suma de donation_allocation (%) supera donation.amount (%) para donation_id %',
      v_allocated_amount, v_total_amount, v_donation_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_check_donation_allocation_sum
  AFTER INSERT OR UPDATE OR DELETE ON finance.donation_allocation
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION finance.check_donation_allocation_sum();

-- Tambien cubre el caso inverso: reducir donation.amount por debajo de lo
-- que ya esta asignado.
CREATE OR REPLACE FUNCTION finance.check_donation_amount_vs_allocations()
RETURNS TRIGGER AS $$
DECLARE
  v_allocated_amount NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_allocated_amount
    FROM finance.donation_allocation WHERE donation_id = NEW.id;

  IF v_allocated_amount > NEW.amount THEN
    RAISE EXCEPTION 'donation.amount (%) no puede ser menor a lo ya asignado (%) para donation_id %',
      NEW.amount, v_allocated_amount, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_check_donation_amount_vs_allocations
  AFTER UPDATE OF amount ON finance.donation
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION finance.check_donation_amount_vs_allocations();

-- ── 2) Ledger append-only ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION finance.prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '%.% es un ledger append-only: no se permite % directo. Registre un asiento de reversal (reversal_of_transaction_id).',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_financial_transaction_mutation
  BEFORE UPDATE OR DELETE ON finance.financial_transaction
  FOR EACH ROW EXECUTE FUNCTION finance.prevent_ledger_mutation();

-- ── 3) Prohibir DELETE fisico en tablas financieras/donaciones ─────────────
CREATE OR REPLACE FUNCTION finance.prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '%.% no permite DELETE fisico: use un cambio de estado auditado (ver donation_status_history).',
    TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_delete_donation
  BEFORE DELETE ON finance.donation
  FOR EACH ROW EXECUTE FUNCTION finance.prevent_hard_delete();

CREATE TRIGGER trg_prevent_delete_payment_transaction
  BEFORE DELETE ON finance.payment_transaction
  FOR EACH ROW EXECUTE FUNCTION finance.prevent_hard_delete();

CREATE TRIGGER trg_prevent_delete_donation_receipt
  BEFORE DELETE ON finance.donation_receipt
  FOR EACH ROW EXECUTE FUNCTION finance.prevent_hard_delete();

-- ── 4) Auditoria automatica de tablas financieras ───────────────────────────
-- El backend debe ejecutar `SELECT set_config('app.current_user_id', $1, true)`
-- (o SET LOCAL equivalente) al inicio de cada transaccion autenticada para que
-- el actor quede registrado; si no se establece, user_id queda NULL (acciones
-- de sistema/trigger).
CREATE OR REPLACE FUNCTION audit.log_financial_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action audit.audit_action;
  v_entity_id UUID;
BEGIN
  BEGIN
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_entity_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_entity_id := NEW.id;
  ELSE
    v_action := 'DELETE';
    v_entity_id := OLD.id;
  END IF;

  INSERT INTO audit.audit_log
    (id, user_id, action, entity_type, entity_id, old_values, new_values, created_at)
  VALUES (
    uuidv7(),
    v_user_id,
    v_action,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    v_entity_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_donation
  AFTER INSERT OR UPDATE OR DELETE ON finance.donation
  FOR EACH ROW EXECUTE FUNCTION audit.log_financial_change();

CREATE TRIGGER trg_audit_donation_allocation
  AFTER INSERT OR UPDATE OR DELETE ON finance.donation_allocation
  FOR EACH ROW EXECUTE FUNCTION audit.log_financial_change();

CREATE TRIGGER trg_audit_payment_transaction
  AFTER INSERT OR UPDATE OR DELETE ON finance.payment_transaction
  FOR EACH ROW EXECUTE FUNCTION audit.log_financial_change();

-- financial_transaction solo admite INSERT (append-only, ver arriba), asi
-- que el audit log solo necesita cubrir ese caso.
CREATE TRIGGER trg_audit_financial_transaction
  AFTER INSERT ON finance.financial_transaction
  FOR EACH ROW EXECUTE FUNCTION audit.log_financial_change();

CREATE TRIGGER trg_audit_donation_status_history
  AFTER INSERT ON finance.donation_status_history
  FOR EACH ROW EXECUTE FUNCTION audit.log_financial_change();
