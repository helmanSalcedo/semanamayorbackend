# Seguridad y datos sensibles

## Datos que NUNCA se almacenan

- Número completo de tarjeta, CVV, claves de acceso a la pasarela de pago.
  `payment_transaction` solo guarda `externalTransactionId` (referencia del
  proveedor), `paymentMethodType` (ej. `"CARD"`, `"PSE"` — el tipo, no el
  dato), `status`, `amount`, `metadata` (JSON del proveedor, sin PAN/CVV).
- Contraseñas en texto plano: `auth.user.passwordHash` (bcrypt/argon2 a
  nivel de aplicación).
- Tokens de sesión/refresh/reset en texto plano: `tokenHash` en
  `session`/`refresh_token`/`password_reset_token`/`email_verification`.

## PII y visibilidad

- `donation.donorVisibility` (`PUBLIC`/`PRIVATE`/`ANONYMOUS`) controla si el
  nombre de un donante puede exponerse públicamente. Por defecto `PRIVATE`.
- `donation.donorNameSnapshot` es una copia del nombre en el momento de
  donar (no un JOIN en vivo a `person`), para que la visualización de una
  donación antigua no cambie si la persona edita su perfil después — y para
  que borrar/anonimizar el registro de una `person` (si se implementa un
  flujo de "derecho al olvido" en el futuro) no reescriba el historial
  financiero.
- `audit_log.ip_address`/`user_agent` se capturan para trazabilidad de
  seguridad; definir una política de retención (ej. purgar después de N
  meses) es una decisión operativa pendiente, no implementada aún como
  proceso automático en este schema.

## RBAC (control de acceso)

`auth.role` + `auth.permission` + `auth.role_permission` + `auth.user_role`
son **tablas**, no enums ni constantes en código — administrable desde base
de datos sin necesidad de un deploy. Roles sembrados en `prisma/seed.ts`:
`SUPER_ADMIN`, `ADMIN_FESTIVAL`, `EDITOR`, `HISTORIAN`, `FINANCE_MANAGER`,
`EVENT_MANAGER`, `MODERATOR`, `BUSINESS_MANAGER`, `SPONSOR_MANAGER`,
`VIEWER`. Convención de código de permiso: `recurso.accion` (ej.
`"donation.allocate"`, `"article.publish"`).

La aplicación de estos permisos (guards/interceptors de NestJS) vive en la
capa de backend, fuera del alcance de este documento — el schema solo
provee las tablas necesarias para que ese control exista.

## Protección a nivel de base de datos, no solo de aplicación

Varias garantías de integridad/seguridad viven en triggers de Postgres, no
solo en el backend, para que sigan valiendo incluso ante un script directo
a la base de datos o un bug en la capa de aplicación:

- No se puede insertar una donación con `beneficiary_type`/`beneficiary_id`
  apuntando a un registro inexistente (trigger de validación polimórfica,
  ver `ARCHITECTURE.md §J.1`).
- No se puede hacer `DELETE` físico de `donation`/`payment_transaction`/
  `donation_receipt`/`financial_transaction` (ver `FINANCIAL_MODEL.md`).
- Toda mutación financiera queda auditada automáticamente (ver `AUDIT.md`).

## Backups y recuperación

Fuera del alcance de este schema (es una decisión de infraestructura del
proveedor de hosting de Postgres elegido). Recomendación al pasar a
producción: backups automáticos diarios + point-in-time recovery (PITR) dado
que este es un sistema con dinero real y patrimonio cultural irremplazable.

## Cifrado

- En tránsito: TLS en la conexión a Postgres (`sslmode=require` en
  `DATABASE_URL` en producción — no configurado en `.env.example` porque el
  entorno local no lo requiere).
- En reposo: depende del proveedor de hosting de Postgres (la mayoría de
  proveedores gestionados cifran el disco por defecto). No se implementó
  cifrado a nivel de columna para ningún campo de este schema porque no hay
  PII de alto riesgo que lo justifique (no se almacenan documentos de
  identidad completos, datos de salud, ni información financiera de
  tarjetas) — revisar si esto cambia si se agrega, por ejemplo, verificación
  de identidad de síndicos con número de cédula completo.
