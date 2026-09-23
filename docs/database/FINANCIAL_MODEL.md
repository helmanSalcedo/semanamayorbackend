# Modelo financiero

Objetivo: que sea **imposible** (no solo "poco probable") que una donación se
pierda, se duplique, se asigne por encima de su monto, o desaparezca sin
dejar rastro.

## Flujo de una donación

```
1. Se crea donation_campaign (opcional: la donación puede ir directo a la Junta)
2. Se crea donation (status = PENDING), amount fijo
3. Se procesa el pago → payment_transaction (idempotente por
   UNIQUE(providerId, externalTransactionId))
4. Al confirmarse el pago: donation.status → CONFIRMED
   + fila en donation_status_history (from_status, to_status, reason)
5. Se crean 1..N donation_allocation (destino: JUNTA | FESTIVAL |
   FESTIVAL_EDITION | PROCESSIONAL_STEP | EVENT)
   → trigger DEFERRABLE valida SUM(amount) <= donation.amount al COMMIT
6. donation.status → ALLOCATED / COMPLETED
7. Se emite donation_receipt (receipt_number autogenerado por SEQUENCE)
```

Pasos 2-5 deben ejecutarse en **una sola transacción de base de datos**
desde el backend (`BEGIN ... COMMIT`), para que un fallo a mitad de camino
haga `ROLLBACK` completo en vez de dejar una donación sin asignar o una
transacción de pago huérfana.

## Garantías a nivel de base de datos (no confiar solo en el backend)

| Garantía | Mecanismo | Dónde |
|---|---|---|
| `amount > 0` en donation/allocation/payment/etc. | `CHECK` constraint | `check_constraints` migration |
| `SUM(allocation.amount) <= donation.amount` | Constraint trigger `DEFERRABLE INITIALLY DEFERRED` | `financial_integrity_and_audit` migration |
| No reducir `donation.amount` por debajo de lo ya asignado | Constraint trigger espejo sobre `UPDATE OF amount` | `financial_integrity_and_audit` migration |
| Idempotencia de webhooks de pago | `UNIQUE(providerId, externalTransactionId)` | `init` migration |
| `financial_transaction` es append-only | Trigger que rechaza UPDATE/DELETE | `financial_integrity_and_audit` migration |
| `donation`/`payment_transaction`/`donation_receipt` nunca se eliminan físicamente | Trigger `prevent_hard_delete` | `financial_integrity_and_audit` migration |
| Toda mutación en tablas financieras queda auditada | Trigger que escribe en `audit.audit_log` | `financial_integrity_and_audit` migration |
| Recibo con consecutivo atómico | `SEQUENCE` + función `next_donation_receipt_number()` | `donation_receipt_sequence` migration |

## Por qué el trigger de suma es `DEFERRABLE`

Si el trigger validara fila por fila (`AFTER INSERT ... FOR EACH ROW` sin
`DEFERRABLE`), la primera fila de una donación dividida en 2+ allocations
fallaría sola (porque en ese instante la suma parcial es menor al total,
pero si se inserta en el orden equivocado o el backend hace dos llamadas,
podría fallar por una condición transitoria). `DEFERRABLE INITIALLY DEFERRED`
espera a que termine toda la transacción (o a `SET CONSTRAINTS ALL
IMMEDIATE`) antes de evaluar, permitiendo insertar todas las allocations de
una donación en cualquier orden dentro de una misma transacción y validar el
conjunto final.

## Por qué NO se usan stored procedures para todo

Se evaluaron y se usaron **solo** donde aportan una garantía que el backend
no puede dar por sí solo:
- ✅ Trigger de suma de allocations (garantía dura, ver arriba).
- ✅ Trigger de append-only / no-DELETE (garantía dura).
- ✅ Trigger de auditoría automática (garantía dura: no depende de que el
  backend recuerde auditar).
- ✅ Función de secuencia para `receipt_number` (atomicidad nativa de
  Postgres, más simple que cualquier alternativa).
- ❌ Cálculo de totales financieros / reportes: se deja al backend o a las
  `views` (ver abajo), porque es lógica de presentación que cambia más
  seguido que la integridad de los datos, y es más fácil de testear e
  iterar en TypeScript que en PL/pgSQL.
- ❌ Validación de campos de negocio no relacionados con dinero (ej.
  formato de email): se deja al backend/DTO validation (`class-validator`),
  no a constraints de BD, porque son reglas de UX que cambian con
  frecuencia.

## Transparencia pública

`financial_report` es un **snapshot congelado**, no una vista en vivo: un
corte "a fecha X" que no cambia retroactivamente aunque lleguen donaciones
nuevas después de publicarlo. Esto evita que la página de transparencia
pública muestre números que cambian silenciosamente bajo los pies del
usuario que la está leyendo.

## Visibilidad del donante

`donation.donorVisibility` (`PUBLIC` | `PRIVATE` | `ANONYMOUS`) +
`isAnonymous`. Nunca se publica el nombre de un donante por defecto
(`PRIVATE` es implícito si no se especifica). `donorNameSnapshot` guarda el
nombre a mostrar en el momento de la donación, independiente de si la
persona (si está vinculada vía `donorPersonId`) cambia su nombre después.

## Moneda

`currency CHAR(3)` en cada tabla monetaria (no hardcodeado a COP a nivel de
schema), con default `'COP'` a nivel de aplicación. Todo monto es
`Decimal @db.Decimal(14, 2)` — nunca `FLOAT`.
