# Arquitectura de base de datos

Plataforma digital para documentar, preservar, administrar y (eventualmente)
monetizar la tradición cultural y religiosa de la Semana Santa de Timbío,
Cauca — diseñada para no quedar limitada a Timbío: el modelo raíz es
`municipality → festival → festival_edition`, genérico para cualquier
festividad o municipio futuro.

Este documento explica las decisiones no obvias del schema. Los comentarios
`///` dentro de los archivos `.prisma` citan secciones de aquí (`§C.3`,
`§G.2`, etc.) — este documento es la fuente de verdad para esas citas.

## Stack

- **PostgreSQL 18** (nativo `uuidv7()`, disponible desde PG 18 sin extensión).
- **Prisma 6** como ORM/migrador, con dos features estables usadas a propósito:
  - `prismaSchemaFolder`: el schema está partido en `prisma/schema/*.prisma`
    por dominio en vez de un único archivo gigante.
  - `multiSchema`: el modelo usa 9 schemas físicos de Postgres (`geo`,
    `heritage`, `operations`, `media`, `cms`, `finance`, `business`, `auth`,
    `audit`) en vez de un único schema `public` con 70 tablas mezcladas.
    Esto separa las responsabilidades a nivel de base de datos, no solo por
    convención de nombres, y permite en el futuro dar permisos de Postgres
    distintos por dominio (ej. un rol de solo-lectura para `heritage`/`cms`
    público, sin acceso a `finance`/`auth`).
- **NestJS** como framework backend (agregado por otra sesión de trabajo;
  ver `src/`). La base de datos es independiente del framework: cualquier
  backend que hable Postgres/Prisma puede consumir este schema.

## A. Entidades y dominios

| Schema       | Responsabilidad                            | Tablas clave                                                                                                                                                                                    |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geo`        | Jerarquía geográfica reutilizable          | country, department, municipality, locality                                                                                                                                                     |
| `heritage`   | Patrimonio, historia, personas, festividad | festival, festival_edition, processional_step, religious_image, person, family, source, content_source, content_rights, historical_event, religious_site                                        |
| `operations` | Procesiones, recorridos, eventos           | procession, procession_step, procession_route(_point), event, event_step, event_organization                                                                                                    |
| `media`      | Multimedia y documentos                    | media_asset, media_attachment, gallery(_item), document(_version)                                                                                                                               |
| `cms`        | Noticias/comunicados                       | article(_version/_category/_tag), tag                                                                                                                                                           |
| `finance`    | Donaciones y transparencia financiera      | donation_campaign, donation, donation_allocation, donation_status_history, donation_receipt, payment_provider, payment_transaction, financial_category, financial_transaction, financial_report |
| `business`   | Patrocinadores y directorio comercial      | organization(_type), sponsorship(_package), business(_category/_location/_contact/_subscription), advertisement(_campaign/_placement)                                                           |
| `auth`       | Usuarios y RBAC                            | user, role, permission, user_role, role_permission, session, refresh_token, password_reset_token, email_verification                                                                            |
| `audit`      | Auditoría                                  | audit_log                                                                                                                                                                                       |

## B. Relaciones principales

```
municipality (geo) ← festival (heritage) ← festival_edition
festival ← processional_step ← religious_image
festival_edition ← procession ← procession_step → processional_step
festival_edition ← event → event_step → processional_step
donation → donation_allocation (N filas, suma ≤ donation.amount)
donation → payment_transaction (idempotente por external_transaction_id)
person ← person_role_assignment → (paso | festival | evento | ... vía subject_type/subject_id)
```

Ver `ERD.md` para el diagrama completo.

## C. Decisiones de diseño

**C.1 — UUID v7 nativo de Postgres.** Todas las PK usan
`@default(dbgenerated("uuidv7()"))`. Se eligió v7 sobre v4 porque es
ordenable temporalmente (mejora el rendimiento de índice B-tree en tablas
grandes como `audit_log` o `financial_transaction`) sin dejar de ser opaco
para exponerse en URLs públicas. Se eligió depender de la función nativa de
PG18 en vez de generarlo en el ORM/aplicación para que la garantía de unicidad
y orden viva en la base de datos, no en cada cliente que escriba en ella.

**C.2 — Multi-schema físico en vez de un solo schema con prefijos.** Ver
sección "Stack" arriba. Alternativa considerada: un solo schema `public`
con nombres de tabla `finance_donation`, `heritage_person`, etc. Se descartó
porque no permite separar permisos de Postgres por dominio y es puramente
cosmético.

**C.3 — Sin tablas históricas duplicadas.** El spec original sugería
`historical_person`, `historical_document`, `historical_place` como
entidades separadas de `person`/`document`/`religious_site`. Se fusionaron:

- `historical_person` → `heritage.person` con `isHistoricalOnly: Boolean` y
  `biographyText`, más `content_source` para citar de dónde sale cada dato.
- `historical_document` → `media.document` (con `document_version` para
  versionado).
- `historical_place` → `heritage.religious_site` con
  `type = SITIO_HISTORICO`.

Razón: mantener una sola tabla de personas/documentos/lugares evita el
problema de "¿en cuál tabla busco a esta persona?" cuando alguien puede ser
simultáneamente un síndico activo hoy Y una figura documentada
históricamente. La trazabilidad de fuente vive en `content_source`
(polimórfico, ver §J.1), no en la tabla del sujeto.

**C.4 — `heritage.role_type` + `person_role_assignment` unifican
`step_person`/`festival_person`/`event_person`/`historical_person`.** El
spec pedía una tabla puente distinta por cada tipo de sujeto. Se unificó en
una sola tabla `person_role_assignment` con `subject_type`/`subject_id`
polimórfico (ver §J.1) más `start_date`/`end_date`/`notes`/`source_id`. Esto
permite responder "¿quién fue síndico del Paso X entre 2015 y 2019, y con
qué fuente?" con una sola tabla en vez de cuatro.

**C.5 — `business.Organization` ≠ `business.Business`.** `Organization` es
el actor legal que puede patrocinar (empresa, institución, medio, persona
natural). `Business` es una ficha del directorio comercial público
(restaurante, hotel...). Se mantienen separadas porque conceptualmente son
cosas distintas (quién patrocina vs. qué aparece en el directorio para
turistas), con un FK opcional `business.organizationId` para cuando la misma
empresa real hace ambas cosas.

**C.6 — Números de recibo por `SEQUENCE`, no por stored procedure.**
`donation_receipt.receiptNumber` se genera a partir de una secuencia nativa
de Postgres (`finance.donation_receipt_seq`), no de una función PL/pgSQL
dedicada. Es la herramienta correcta de Postgres para consecutivos: atómica,
sin condiciones de carrera, sin necesidad de lógica adicional.

## D. Riesgos conocidos

- **Polimorfismo controlado sin FK física** (ver §J.1): un `owner_id` mal
  escrito desde fuera de las rutas validadas por trigger fallaría solo si
  viola el trigger, pero un `UPDATE` directo a la tabla sin pasar por INSERT
  podría en teoría dejar datos huérfanos si algún trigger no cubre todos los
  casos. Mitigación: los triggers de `integrity_triggers` cubren
  INSERT/UPDATE de las columnas type/id en las 6 tablas polimórficas.
- **`geo.municipality_id` sin FK en las primeras migraciones**: se detectó y
  corrigió en la migración `add_municipality_foreign_keys` (agrega FK real
  Postgres cross-schema desde `festival`, `religious_site` y
  `business_location` hacia `geo.municipality`).
- **Ledger `financial_transaction` append-only depende del trigger, no de
  revocar privilegios de rol de Postgres.** Es más simple de operar (no hay
  que gestionar roles de BD separados para el backend), pero un superusuario
  de Postgres podría bypassearlo. Aceptable para el tamaño actual del
  proyecto; revisar si se necesita una capa adicional (revocar GRANT
  UPDATE/DELETE al rol de aplicación) cuando haya un rol de app no-superuser
  en producción.

## E. Datos que NO se almacenan

Ver `SECURITY.md`.

## F. Escalabilidad

`municipality_id`/`festival_id` como raíz de filtrado permite agregar
festividades sin tocar el schema. Multimedia vive fuera de Postgres
(`media_asset.storageKey` apunta a storage externo). Ver `FINANCIAL_MODEL.md`
para el diseño de particionamiento futuro de `audit_log`/`financial_transaction`
si el volumen lo exige (no implementado aún, decisión diferida).

## G. Integridad financiera

Ver `FINANCIAL_MODEL.md` para el detalle completo. Resumen:

**G.1 — Nunca se guarda dinero en FLOAT.** Todos los montos son
`Decimal @db.Decimal(14, 2)`.

**G.2 — Guardia de suma de allocations.** `finance.donation_allocation` no
tiene forma de expresar en el DSL de Prisma "la suma de mis filas hermanas no
debe superar `donation.amount`". Se implementó como un
`CREATE CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED` en la migración
`financial_integrity_and_audit`: se evalúa al COMMIT (o al
`SET CONSTRAINTS ALL IMMEDIATE`), no fila por fila, para que una donación que
se divide en varios INSERT dentro de la misma transacción se valide como un
conjunto. Existe un trigger espejo sobre `UPDATE OF amount` en `donation`
para el caso inverso (reducir el monto por debajo de lo ya asignado).

**G.3 — Ledger append-only.** `financial_transaction` prohíbe UPDATE/DELETE
vía trigger; las correcciones son nuevas filas que referencian
`reversalOfTransactionId`.

**G.4 — Nunca DELETE físico de `donation`/`payment_transaction`/
`donation_receipt`.** Trigger `prevent_hard_delete`. Los cambios de estado
viven en `donation_status_history`.

**G.5 — Idempotencia de pagos.** `UNIQUE(providerId, externalTransactionId)`
en `payment_transaction` impide procesar dos veces el mismo webhook.

## H. Trazabilidad de patrimonio y derechos

`heritage.content_rights` (subject_type/subject_id polimórfico) registra
propietario, custodio, tipo de derecho, licencia y estado de autorización
para cualquier imagen/documento/paso, con estado por defecto
`UNKNOWN_PENDING_VERIFICATION` — nunca se asume que un archivo encontrado es
reutilizable. `heritage.source` + `content_source` obligan a poder citar de
dónde sale cualquier afirmación histórica.

## I. Auditoría

Ver `AUDIT.md`.

## J. Integridad referencial polimórfica

**J.1 — Patrón usado en 6 tablas:** `person_role_assignment`,
`content_source`, `content_rights`, `media_attachment`,
`donation_allocation`, `sponsorship`. Todas usan
`{subject|sourceable|attachable|beneficiary|sponsorable}_type` (enum
cerrado) + `..._id` (UUID) en vez de una FK física, porque un mismo `_id`
no puede ser FK real hacia 6-8 tablas distintas a la vez en Postgres.
La integridad se garantiza con un trigger `BEFORE INSERT OR UPDATE OF
..._type, ..._id` por tabla (ver migración `integrity_triggers`) que hace
`EXISTS (SELECT 1 FROM <tabla_correspondiente> WHERE id = ..._id)` según el
valor del `_type`, y `RAISE EXCEPTION` si no existe o el tipo no está
soportado. Esto da la misma garantía que una FK física sin necesitar una
tabla puente dedicada por cada combinación entidad-entidad.

## §16 — Multimedia: denormalización intencional

`processional_step.primaryMediaAssetId` duplica lo que ya se puede derivar de
`media_attachment` (role=PRIMARY). Es una denormalización deliberada para
listados públicos de alto tráfico (no requiere un JOIN/subquery para mostrar
la imagen principal de cada paso en una grilla). La relación completa y
autoritativa sigue viviendo en `media_attachment`; el campo denormalizado
debe mantenerse sincronizado desde el backend al cambiar el adjunto PRIMARY.

## §41 — SEO

Los campos SEO (`metaTitle`, `metaDescription`, `canonicalUrl`,
`socialImageMediaAssetId`) se agregaron directamente en `cms.Article`, no en
una tabla `seo_metadata` genérica, porque hoy es la única entidad pública que
los necesita. Si en el futuro `processional_step`, `event` o `business`
también requieren SEO propio, evaluar extraer una tabla reutilizable en ese
momento (YAGNI: no se construyó preventivamente).
