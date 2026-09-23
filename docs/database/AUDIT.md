# Auditoría

## Qué queda registrado

`audit.audit_log` registra: `user_id`, `action`, `entity_type`, `entity_id`,
`old_values`, `new_values` (JSONB — snapshot de la fila antes/después),
`ip_address`, `user_agent`, `created_at`.

Acciones (`audit.audit_action`): `CREATE`, `UPDATE`, `DELETE`, `LOGIN`,
`LOGOUT`, `PUBLISH`, `UNPUBLISH`, `PAYMENT`, `REFUND`, `OTHER`.

## Auditoría automática (obligatoria, a nivel de base de datos)

Las siguientes tablas tienen un trigger `AFTER INSERT OR UPDATE OR DELETE`
que escribe en `audit.audit_log` sin depender de que el backend "se
acuerde" de llamar a un servicio de auditoría (sección 28 del spec:
"los registros financieros y de donaciones deben tener auditoría
obligatoria"):

- `finance.donation`
- `finance.donation_allocation`
- `finance.payment_transaction`
- `finance.financial_transaction` (solo INSERT — es append-only, ver
  `FINANCIAL_MODEL.md`)
- `finance.donation_status_history` (solo INSERT — es un log, no se edita)

Implementación: función `audit.log_financial_change()` (migración
`financial_integrity_and_audit`), que arma `entity_type` como
`"<schema>.<tabla>"` (ej. `"finance.donation"`) usando `TG_TABLE_SCHEMA` /
`TG_TABLE_NAME`, y usa `to_jsonb(OLD)`/`to_jsonb(NEW)` para los snapshots.

## Auditoría desde la aplicación

Eventos que no son mutaciones de fila en `finance.*` (login/logout,
publish/unpublish de contenido, cambios de permisos) deben ser insertados
explícitamente por el backend en `audit.audit_log`, ya que no hay una tabla
única y consistente que un trigger genérico pueda observar para esos casos.

## Identificar al actor dentro de un trigger

Los triggers no tienen acceso directo a "qué usuario autenticado hizo esta
petición HTTP". El backend debe ejecutar, al inicio de cada transacción
autenticada:

```sql
SELECT set_config('app.current_user_id', '<uuid-del-usuario>', true);
```

(el `true` final lo hace `LOCAL` a la transacción — se olvida solo al hacer
COMMIT/ROLLBACK). Si no se establece, `audit_log.user_id` queda `NULL`
(se interpreta como "acción de sistema").

## Qué NO hace este mecanismo

- No sustituye el control de acceso (RBAC, ver `SECURITY.md`): audita lo que
  pasó, no impide que pase.
- No captura cambios hechos fuera de Postgres (ej. un backup restaurado
  manualmente) — eso requiere auditoría a nivel de infraestructura, fuera
  del alcance de este schema.
- Los triggers de auditoría corren `AFTER` la operación, dentro de la misma
  transacción: si la transacción hace `ROLLBACK` después (por ejemplo por
  el guard de suma de allocations), la fila de auditoría también se
  revierte — no queda un log fantasma de algo que nunca se confirmó. Esto es
  intencional: solo se audita lo que realmente sucedió.
