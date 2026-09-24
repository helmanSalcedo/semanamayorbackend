# Semana Santa de Timbío — plataforma cultural/religiosa

[![CI](https://github.com/helmanSalcedo/semanamayorbackend/actions/workflows/ci.yml/badge.svg)](https://github.com/helmanSalcedo/semanamayorbackend/actions/workflows/ci.yml)

Plataforma digital para documentar, preservar, administrar y (a futuro)
apoyar económicamente la tradición de la Semana Santa de Timbío, Cauca,
Colombia. El modelo de datos es genérico — `municipality → festival →
festival_edition` — para poder soportar otras festividades o municipios en
el futuro sin quedar acoplado a Timbío.

**Estado actual:** la base de datos está completa y en producción-ready.
Sobre ella corre un backend NestJS con foundation profesional (config
validada, Prisma, logging estructurado, manejo de errores, rate limiting,
Swagger), autenticación/RBAC reales, media (Firebase Storage), el dominio
**heritage** + **operations** completo (festividades, ediciones, pasos
procesionales, imágenes religiosas, sitios religiosos, personas y sus roles
culturales, trazabilidad de fuentes documentales, eventos y procesiones), y
el flujo de **donaciones** (finance) con integridad financiera real: split
de donaciones entre beneficiarios, confirmación/reembolso auditados,
recibos automáticos, transacciones de pago idempotentes. Sin tocar todavía:
contabilidad interna (ledger de gastos/ingresos, reportes de transparencia),
CMS/artículos, directorio comercial, ni frontend.

📖 **Empieza por [`docs/database/README.md`](./docs/database/README.md)**
para la documentación completa de la arquitectura de datos (decisiones de
diseño, modelo financiero, modelo histórico, auditoría, seguridad, ERD).

## Stack

- **PostgreSQL 18** + **Prisma 6** (ORM y migraciones)
- **NestJS 11** (backend)
  - Config validada con Zod (`src/config`), falla rápido si falta una env var
  - Logging estructurado con `nestjs-pino` (request id, redacción de headers sensibles)
  - `PrismaService` global (`src/prisma`) + filtro global de excepciones con envelope consistente
  - Rate limiting global (`@nestjs/throttler`), Helmet + compression
  - Health check (`GET /health`, sin prefijo ni versión) con `@nestjs/terminus`
  - Swagger en `/api/docs` (deshabilitado en producción)
  - Auth JWT (access + refresh con rotación) y RBAC por roles/permisos reales
    de `auth.role` / `auth.permission` (`src/auth`)
  - Verificación de email y reset de contraseña vía `src/mail` (sin
    `SMTP_HOST` configurado, los correos se escriben al log en vez de
    enviarse — suficiente para dev)
  - Media (`src/media` + `src/storage`): subida de imagen/video/audio/PDF a
    Firebase Storage (público), con `MediaAsset` en Postgres para metadatos.
    Sin credenciales de Firebase configuradas, el endpoint de subida devuelve
    error 500 explícito en vez de fallar el arranque de toda la app
- Schema multi-dominio (`prisma/schema/*.prisma`) sobre 9 schemas físicos de
  Postgres (`geo`, `heritage`, `operations`, `media`, `cms`, `finance`,
  `business`, `auth`, `audit`)

## Requisitos

- Node.js 20+
- pnpm
- PostgreSQL 18 (local, Docker vía `docker-compose.yml`, o gestionado)

## Setup

```bash
pnpm install
cp .env.example .env   # ajustar DATABASE_URL / TEST_DATABASE_URL y generar
                        # JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (openssl rand -base64 48)

# Aplicar migraciones y generar el cliente Prisma
npx prisma migrate deploy
npx prisma generate

# Seed técnico (roles, permisos, catálogos, geografía — sin datos
# históricos inventados, ver docs/database/HISTORICAL_MODEL.md)
npx tsx prisma/seed.ts
```

## Desarrollo

```bash
pnpm run start:dev       # servidor NestJS en modo watch (http://localhost:3000)
pnpm run test            # tests unitarios (mocks, sin DB)
pnpm run test:e2e        # e2e de la app completa contra TEST_DATABASE_URL
pnpm run test:integration # tests de integración del modelo de datos (Postgres real)
```

Con el servidor corriendo: `GET /health` (estado de la conexión a Postgres)
y `/api/docs` (Swagger, solo fuera de producción). Los endpoints de
autenticación viven bajo `/api/v1/auth`:

| Endpoint | Público | Descripción |
|---|---|---|
| `POST /register` | sí | Crea la cuenta (rol `VIEWER`), dispara email de verificación |
| `POST /login` | sí | Devuelve access + refresh token |
| `POST /refresh` | sí | Rota un refresh token válido por un par nuevo |
| `POST /logout` | sí | Revoca un refresh token |
| `GET /me` | no | Identidad del usuario autenticado |
| `POST /verify-email` | sí | Confirma el correo con el token recibido por email |
| `POST /resend-verification` | sí | Reenvía el correo de confirmación (respuesta genérica, no revela si el email existe) |
| `POST /forgot-password` | sí | Inicia recuperación de contraseña (respuesta genérica) |
| `POST /reset-password` | sí | Fija una contraseña nueva y revoca todas las sesiones activas de esa cuenta |

El resto de roles (`ADMIN_FESTIVAL`, `FINANCE_MANAGER`, etc.) se asignan
manualmente vía `auth.user_role` hasta que exista panel administrativo.

### Catálogos de referencia (`/api/v1/countries`, `/departments`, `/municipalities`, `/localities`, `/role-types`, `/payment-providers`)

Endpoints públicos y de solo lectura sobre datos seeded que otros módulos referencian por UUID. Antes de esta fase no existía forma de descubrir esos UUIDs desde la API — había que consultar Postgres directamente.

| Endpoint | Descripción |
|---|---|
| `GET /countries` | Catálogo de países |
| `GET /departments?countryId=` | Departamentos, filtrable por país |
| `GET /municipalities?departmentId=` | Municipios, filtrable por departamento — el `id` que piden `Festival`, `Business`, `ReligiousSite`, etc. |
| `GET /localities?municipalityId=` | Barrios/veredas/corregimientos, filtrable por municipio |
| `GET /role-types` | Catálogo de tipos de rol cultural (síndico, carguero, sahumadora, historiador...) que pide `PersonRoleAssignment.roleTypeId` |
| `GET /payment-providers` | Catálogo de proveedores de pago (`MANUAL`/`WOMPI`/`PAYU`/`EPAYCO`) — informativo; `POST /donations/:id/transactions` sigue recibiendo el `providerCode` como string |

### Heritage — genealogía (`/api/v1/families`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /families` | `person.manage` | Crea una familia (árbol genealógico) |
| `GET /families`, `GET /families/:id` | público | Lista / detalle |
| `PATCH /families/:id`, `DELETE /families/:id` | `person.manage` | Actualiza / soft-elimina |
| `POST /families/:familyId/members` | `person.manage` | Vincula una persona a la familia (`relationshipNote` y `sourceId` opcionales) |
| `GET /families/:familyId/members` | público | Lista los miembros (con la persona incluida) |
| `DELETE /families/:familyId/members/:memberId` | `person.manage` | Quita el vínculo |

Puntos clave de este módulo:
- **`sourceId` es opcional a propósito**: la columna es nullable en la base de datos precisamente para no bloquear el primer borrador de un árbol genealógico en construcción (ver `HISTORICAL_MODEL.md` § Familias: "nunca se asume un parentesco sin fuente" es una regla editorial para publicar el vínculo como hecho verificado, no una restricción de esquema). No existe todavía un campo de estado "verificado"/"borrador" en el modelo, así que esta API no fuerza `sourceId` — lo deja disponible para cuando exista ese flujo de publicación.
- **Vínculo duplicado bloqueado**: intentar vincular la misma persona dos veces a la misma familia responde `409` (constraint único `[familyId, personId]`).
- Antes de esta fase, `Family`/`FamilyPerson` existían en el schema y `ContentSource` ya los validaba como uno de sus tipos polimórficos posibles, pero no había ninguna forma de crear una familia o un vínculo — era un modelo completo sin interfaz.

### Heritage — festividades (`/api/v1/festivals`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /festivals` | `festival.manage` | Crea una festividad (slug autogenerado desde `name` si se omite) |
| `GET /festivals` | público | Lista festividades |
| `GET /festivals/:id` | público | Detalle |
| `PATCH /festivals/:id` | `festival.manage` | Actualiza (el slug solo cambia si se manda explícito) |
| `DELETE /festivals/:id` | `festival.manage` | Soft-delete |
| `POST /festivals/:festivalId/editions` | `festival.manage` | Crea una edición (año) de la festividad |
| `GET /festivals/:festivalId/editions` | público | Lista ediciones |
| `GET /festivals/:festivalId/editions/:editionId` | público | Detalle |
| `PATCH /festivals/:festivalId/editions/:editionId` | `festival.manage` | Actualiza |
| `DELETE /festivals/:festivalId/editions/:editionId` | `festival.manage` | Hard-delete (falla con 409 si tiene procesiones/eventos/galerías asociadas — `FestivalEdition` no tiene soft-delete en el schema) |

El `id` de una edición es el `festivalEditionId` que acepta `POST /media` para
organizar el storage por festividad (ver sección de Media). Todos los `GET`
de listas están paginados (`?page=1&limit=20`, máx. 100), devuelven
`{ data, meta: { page, limit, total, totalPages } }`.

**Pasos procesionales** (`/festivals/:festivalId/steps`, permiso
`processional_step.manage`): CRUD completo, slug autogenerado y único por
festividad, soft-delete. `primaryMediaAssetId` valida contra un `MediaAsset`
ya subido y crea/reemplaza automáticamente el `MediaAttachment` real
(role=`PRIMARY`) — no es solo un campo cosmético.

**Imágenes religiosas** (`/festivals/:festivalId/steps/:stepId/religious-images`,
permiso `religious_image.manage`): anidadas bajo su paso procesional, CRUD
completo, soft-delete.

**Sitios religiosos/históricos** (`/religious-sites`, permiso
`religious_site.manage`): iglesias, capillas, sitios históricos — recurso de
nivel superior scopeado por municipio, no por festividad. CRUD completo,
slug autogenerado.

**Fuentes documentales** (`/sources`, permiso `source.manage`): catálogo de
fuentes citables (libro, acta, archivo, testimonio oral, etc.), CRUD
completo, soft-delete.

**Citas de fuente** (`/content-sources`, permiso `source.manage`): vincula
una fuente a cualquier entidad citable (`sourceableType` + `sourceableId`:
persona, paso procesional, imagen religiosa, evento, sitio, documento,
familia, evento histórico). `GET /content-sources?sourceableType=X&sourceableId=Y`
lista las fuentes citadas en una entidad — es la trazabilidad documental que
el proyecto marca como no-negociable en `docs/database/HISTORICAL_MODEL.md`.

**Personas** (`/people`, permiso `person.manage`): personas históricas o
actuales, CRUD completo, soft-delete.

**Roles de persona** (`/person-role-assignments`, permiso `person.manage`):
"esta persona fue síndico del Paso X entre 2015 y 2019" — vincula una
persona + un `RoleType` (síndico, carguero, etc.) + una entidad
(`subjectType`/`subjectId`: paso, festival, edición, evento, evento
histórico, sitio), con rango de fechas y fuente opcional.
`GET /person-role-assignments?personId=X` o `?subjectType=X&subjectId=Y`
(al menos uno de los dos es obligatorio).

### Operaciones — programación (`/api/v1/festivals/:festivalId/editions/:editionId`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `.../events` | `event.manage` | Programación anual (misas, conciertos, actividades) de una edición |
| `.../processions` | `procession.manage` | Procesiones de una edición (fecha, horario, recorrido a alto nivel) |

Ambos con CRUD completo, slug autogenerado en `Event`, soft-delete, y
validación de pertenencia a la festividad/edición del path. Las horas
(`startTime`/`estimatedEndTime` de `Procession`) se envían como `"HH:mm"`.

**Relacional de operations** (permiso `procession.manage` / `event.manage`,
solo create+list+remove, sin PATCH, siguiendo el mismo patrón que
media-attachments/content-sources/person-role-assignments):

- `.../processions/:processionId/steps` — orden de pasos procesionales
  dentro de una procesión (`order` único por procesión)
- `.../processions/:processionId/routes` (+ `/:routeId/points`) — recorrido
  con puntos lat/lng, ordenados
- `.../events/:eventId/steps` — pasos procesionales que participan en un
  evento
- `.../events/:eventId/organizations` — organizaciones vinculadas a un
  evento (patrocinador, organizador). Depende de `Organization`
  (`business`, Fase G — sin construir todavía): valida contra la tabla real
  y devuelve 400 claro mientras no exista el registro, verificado con curl

### CMS — artículos (`/api/v1/articles`, `/api/v1/article-categories`, `/api/v1/tags`)

Permiso `article.create` para categorías/tags/artículos, `article.publish`/
`article.unpublish` para las transiciones de estado.

- **`GET /articles`** (público) y **`GET /articles/:id`** (público): **solo
  `PUBLISHED`**, siempre — un draft nunca es visible ni siquiera conociendo
  su id directo. Verificado real: 404 antes de publicar, 200 después,
  404 de nuevo tras despublicar.
- **`GET /articles/manage`** / **`GET /articles/:id/manage`**: vista
  editorial con todos los estados (`article.create`)
- **`POST /articles/:id/publish`** / **`.../unpublish`**: transición de
  estado, separada del `PATCH` general
- **`PATCH /articles/:id`**: guarda automáticamente título+contenido
  anteriores en `GET /articles/:id/versions` antes de aplicar el cambio
  (mismo patrón que `Document`) — verificado con curl, el historial
  conservó el contenido original tras la corrección
- `tagIds` en create/update reemplaza los vínculos con `Tag` completos (no
  hace diff incremental)

### Galerías y documentos (`/api/v1/galleries`, `/api/v1/documents`)

Permiso `media_asset.manage` para galerías, `source.manage` para documentos.

- **`galleries`** + **`galleries/:id/items`** — colección ordenada de
  `MediaAsset`s ya subidos, opcionalmente ligada a una `FestivalEdition`
- **`documents`** — documentos históricos (actas, prensa, manuscritos),
  opcionalmente ligados a un `MediaAsset` (el escaneo) y a un `Source`.
  Cada `PATCH` guarda automáticamente un snapshot del estado anterior en
  `GET /documents/:id/versions` antes de aplicar el cambio — verificado
  real: corregir el título de un acta dejó la versión 1 con el título
  original en el historial.

### Vínculos genéricos de media (`/api/v1/media-attachments`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /media-attachments` | `media_asset.manage` | Vincula un `MediaAsset` ya subido a cualquier entidad (festival, paso, imagen, sitio, evento, persona, artículo, documento) |
| `GET /media-attachments?attachableType=X&attachableId=Y` | público | Lista los archivos vinculados a una entidad |
| `DELETE /media-attachments/:id` | `media_asset.manage` | Quita el vínculo (no borra el archivo) |

Valida en la capa de aplicación que la entidad exista antes de tocar la DB —
espeja el trigger `media.validate_media_attachment_attachable` para devolver
un 400 claro en vez de un 500 opaco si algo no cuadra.

### Histórico y derechos (`/api/v1/historical-periods`, `/api/v1/historical-events`, `/api/v1/content-rights`)

Permiso `historical_content.manage` para periodos/hechos históricos,
`source.manage` para derechos (mismo dominio documental que `Source`).

- **`historical-periods`** — catálogo de periodos (ej. "Colonia"), sin
  soft-delete en el schema (hard-delete; los hechos que lo referencian
  quedan con `periodId = NULL`)
- **`historical-events`** — hechos discretos, opcionalmente ligados a un
  `Festival` y/o `HistoricalPeriod`, con `datePrecision`
  (EXACT/YEAR/DECADE/CIRCA/UNKNOWN) y `reliabilityLevel`
  (VERIFIED/PROBABLE/DISPUTED/LEGENDARY) — nunca se fuerza una fecha exacta
  ficticia para un dato aproximado
- **`content-rights`** — estado de derechos de uso de un archivo/patrimonio
  (`MediaAsset`, `ProcessionalStep`, `ReligiousImage`, `Document`); por
  defecto `UNKNOWN_PENDING_VERIFICATION` — nunca se asume que algo
  encontrado puede reutilizarse sin verificar

### Auth — mis sesiones (`/api/v1/auth/sessions`)

| Endpoint | Descripción |
|---|---|
| `GET /auth/sessions` | Lista las sesiones activas (no revocadas, no expiradas) del usuario autenticado: dispositivo (`userAgent`), IP, fecha de creación/expiración |
| `DELETE /auth/sessions/:id` | Cierra una sesión remota — revoca su(s) `refreshToken` para que no pueda volver a renovar; el `accessToken` que ya tenía emitido ese dispositivo sigue siendo válido hasta que expire por sí solo (máx. `accessExpiresIn`, normalmente minutos) |

Puntos clave:
- **`Session` agrupa toda la cadena de rotación, no un token puntual**: cada `POST /auth/refresh` emite un `RefreshToken` nuevo y revoca el anterior (rotación), pero ambos comparten el mismo `sessionId` — por eso "mis sesiones" lista dispositivos/logins reales y no crece con cada renovación silenciosa que hace el frontend en segundo plano. Verificado real: tras varios `refresh` seguidos sobre la misma sesión, `GET /auth/sessions` sigue mostrando la misma fila (mismo `id`, `expiresAt` extendido).
- **`register`/`login` siempre crean una sesión nueva** (un dispositivo/login distinto cada vez); `refresh` reutiliza la sesión existente del token que se está rotando.
- **`logout` revoca el refresh token y su sesión** (cierra "este" dispositivo); `DELETE /auth/sessions/:id` hace lo mismo mecanismo pero para "otro" dispositivo sin tener su refresh token a mano.
- Este módulo existía en el schema desde el inicio (`auth.session` con `userAgent`/`ipAddress`) pero `AuthService` nunca lo usaba — toda la seguridad de sesión corría solo por `RefreshToken`, sin visibilidad de dispositivos ni forma de cerrar sesión remota. Se agregó `session_id` a `refresh_token` (migración `add_session_refresh_token_link`) para poder enlazarlos.

### Auth — autogestión de cuenta (`/api/v1/auth/me`, `/api/v1/auth/change-password`)

| Endpoint | Descripción |
|---|---|
| `PATCH /auth/me` | Actualiza mi propio `fullName`/`phone` — no permite tocar `email`, `isActive` ni roles (eso sigue siendo exclusivo de `PATCH /users/:id` con `user.manage`) |
| `POST /auth/change-password` | Cambia mi contraseña estando logueado, requiriendo la actual. Cierra **todas** mis sesiones (igual que el flujo de recuperación por correo) — hay que loguearse de nuevo después |

Antes de esta fase, `UsersController` (`/users`) tenía `@Permissions('user.manage')` a nivel de clase sobre **todos** sus métodos, incluidos los `GET`: un usuario sin ese permiso no podía ni ver ni editar su propio perfil, y la única forma de cambiar de contraseña era el flujo de "olvidé mi contraseña" por correo (no había un "cambiar mi contraseña" estando ya logueado). De paso se corrigió una inconsistencia real: `resetPassword` revocaba los `refreshToken` de todas las sesiones pero no las filas de `Session`, así que `GET /auth/sessions` seguía mostrándolas como activas aunque ya no pudieran renovarse — ahora ambos flujos (`resetPassword` y `changePassword`) revocan sesión y refresh token juntos, en la misma transacción.

### Admin — usuarios, roles, permisos, auditoría (`/api/v1/{users,roles,permissions,audit-log}`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `GET /users` | `user.manage` | Lista usuarios (filtrable por `isActive`/`roleCode`), nunca incluye `passwordHash` |
| `PATCH /users/:id` | `user.manage` | Actualiza nombre/teléfono/activo (no email/password — eso va por `/auth`) |
| `POST /users/:id/roles` | `role.manage` | Asigna un rol (idempotente) |
| `DELETE /users/:id/roles/:roleId` | `role.manage` | Revoca un rol |
| `GET /roles`, `GET /permissions` | `role.manage` | Catálogos |
| `POST /roles/:id/permissions` | `role.manage` | Asigna un permiso a un rol (rechaza tocar `SUPER_ADMIN`, que ya tiene todos por diseño) |
| `GET /audit-log` | `audit_log.read` | Lee `audit.audit_log` (filtrable por entidad/usuario/acción) |

Este es el panel administrativo que el seed dejaba pendiente ("el resto se
asigna manualmente... cuando exista panel administrativo"). Verificado real:
asignar `HISTORIAN` a un usuario, darle `source.manage` a ese rol, y
confirmar que el usuario pudo crear una fuente después de volver a loguearse
(el JWT se refresca con los permisos nuevos recién en el próximo login/refresh,
no en caliente).

### Finance — donaciones (`/api/v1/donation-campaigns`, `/api/v1/donations`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /donation-campaigns` | `donation_campaign.manage` | Crea una campaña de donación |
| `GET /donation-campaigns` | público | Lista campañas |
| `POST /donations` | **público** | Registra una intención de donación (estado `PENDING`) con sus `allocations` — no requiere cuenta, pensado para el donante |
| `GET /donations`, `GET /donations/:id` | `donation.read` | Contienen PII del donante (nombre, email) — nunca públicos |
| `GET /donations/:id/receipt` | `donation.read` | Recibo (solo existe si la donación está `CONFIRMED`) |
| `POST /donations/:id/confirm` | `donation.create` | Confirma una donación `PENDING` (ej. pago manual verificado) y emite el recibo |
| `POST /donations/:id/cancel` | `donation.create` | Cancela una donación `PENDING` |
| `POST /donations/:id/refund` | `donation.refund` | Reembolsa una donación `CONFIRMED` |
| `POST /donations/:id/transactions` | `donation.create` | Registra un intento/resultado de pago (idempotente por `providerCode`+`externalTransactionId`) |

Puntos clave de este módulo:
- **`allocations` debe sumar exactamente `amount`** — validado en la app antes de tocar la DB, y reforzado por un `CONSTRAINT TRIGGER DEFERRABLE` en Postgres como última línea de defensa.
- **Nunca se hace `DELETE` físico** de `donation`/`payment_transaction`/`donation_receipt` — la DB lo bloquea con un trigger (`prevent_hard_delete`); los cambios de estado quedan en `donation_status_history`. Verificado real: un intento de borrar un recibo de prueba falló con el mensaje del trigger, tal como debía.
- **Auditoría real**: antes de cada transacción que toca tablas financieras, el backend ejecuta `SELECT set_config('app.current_user_id', ...)` (`src/finance/audit-actor.util.ts`) para que `audit.audit_log` sepa quién hizo el cambio — confirmado con una donación pública (actor `NULL`) y una confirmación por un admin (actor con su `user_id`).
- **`POST /donations/:id/transactions` es un endpoint autenticado directo, no un webhook firmado del proveedor de pago** — eso todavía no existe. Simula el rol de un webhook (Wompi/PayU/ePayco) para poder probar el flujo de confirmación/reembolso automático mientras tanto.
- Un `PaymentTransaction` con `status: SUCCEEDED` confirma la donación automáticamente (recibo incluido); `FAILED` la marca fallida si seguía `PENDING`; `REFUNDED` dispara el reembolso.

### Finance — contabilidad interna (`/api/v1/financial-categories`, `/api/v1/financial-transactions`, `/api/v1/financial-reports`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /financial-categories` | `financial_category.manage` | Crea una categoría contable (`INCOME`/`EXPENSE`), opcionalmente con `parentId` para subcategorías |
| `GET /financial-categories`, `GET /financial-categories/:id` | público | Catálogo de categorías |
| `PATCH /financial-categories/:id` | `financial_category.manage` | Actualiza nombre/tipo/padre |
| `DELETE /financial-categories/:id` | `financial_category.manage` | Elimina la categoría — falla con `409` si tiene transacciones asociadas (FK `RESTRICT`) |
| `POST /financial-transactions` | `financial_transaction.manage` | Registra un asiento en el ledger (`categoryId`, `type`, `amount`, `occurredAt`, referencias opcionales a una donación o campaña) |
| `GET /financial-transactions`, `GET /financial-transactions/:id` | `financial_transaction.manage` | Ledger interno — **no es público**, a diferencia de los reportes |
| `POST /financial-transactions/:id/reverse` | `financial_transaction.manage` | Registra la reversa de un asiento como una entrada nueva de tipo opuesto, enlazada por `reversalOfTransactionId` |
| `POST /financial-reports` | `financial_report.publish` | Genera un snapshot de transparencia (suma de ingresos/egresos) para un periodo y, opcionalmente, una campaña |
| `GET /financial-reports`, `GET /financial-reports/:id` | **público** | Reportes de transparencia ya publicados |

Puntos clave de este módulo:
- **El ledger es append-only** — no existen `PATCH`/`DELETE` para `FinancialTransaction`. Un trigger de Postgres (`prevent_ledger_mutation`) bloquea cualquier `UPDATE`/`DELETE` directo; la única forma de "corregir" un asiento es `reverse()`, que crea una entrada nueva de tipo opuesto y el mismo monto. Verificado real contra Postgres: un `DELETE` manual de una transacción de prueba fue rechazado por el trigger.
- **Doble reversa bloqueada**: `reverse()` revisa si ya existe una transacción con `reversalOfTransactionId` apuntando al asiento original y responde `400` si es así.
- **Ledger interno vs. reportes públicos**: `FinancialTransaction` está completamente cerrado por permiso (incluidas las lecturas) porque es contabilidad interna; `FinancialReport` es de lectura pública porque es el corte fijo de transparencia que se publica hacia afuera — nunca una vista en vivo del ledger.
- **Auditoría real**: igual que en donaciones, cada `$transaction` sobre el ledger llama a `setAuditActor()` (`src/finance/audit-actor.util.ts`) para que `audit.audit_log` registre quién hizo el asiento.
- Al construir este módulo se detectó y corrigió un bug preexistente en el filtro global de excepciones (`src/common/filters/all-exceptions.filter.ts`): algunas violaciones de FK `RESTRICT` llegan como `PrismaClientUnknownRequestError` en vez de `P2003`, y devolvían `500` en lugar de `409`. Ahora se detecta el `SQLSTATE` (`23001`/`23503`) en el mensaje crudo de Postgres como respaldo.

### Directorio, patrocinios y publicidad (`/api/v1/organizations`, `/sponsorship-packages`, `/sponsorships`, `/businesses`, `/advertisement-campaigns`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `GET /organization-types`, `GET /business-categories` | público | Catálogos seeded (empresa/institución/medio/persona natural; cafetería/hotel/restaurante/…) |
| `POST /organizations` | `organization.manage` | Crea una organización (patrocinador/entidad legal) |
| `GET /organizations`, `GET /organizations/:id` | público | Directorio de organizaciones |
| `PATCH /organizations/:id`, `DELETE /organizations/:id` | `organization.manage` | Actualiza / soft-elimina una organización |
| `POST /sponsorship-packages` | `sponsorship.manage` | Crea un paquete de patrocinio (precio, beneficios en JSON libre) |
| `GET /sponsorship-packages`, `GET /sponsorship-packages/:id` | público | Catálogo de paquetes |
| `POST /sponsorships` | `sponsorship.manage` | Registra el patrocinio de una organización sobre un `FESTIVAL`/`FESTIVAL_EDITION`/`EVENT`/`PROCESSIONAL_STEP`/`DONATION_CAMPAIGN` (validado contra la tabla real correspondiente) |
| `GET /sponsorships` | público | Lista patrocinios, filtrable por `organizationId`/`sponsorableType`/`sponsorableId` |
| `PATCH /sponsorships/:id/status`, `DELETE /sponsorships/:id` | `sponsorship.manage` | Cambia estado (`PENDING`/`ACTIVE`/`EXPIRED`/`CANCELLED`) o elimina |
| `POST /businesses` | `business.manage` | Registra un negocio en el directorio (nace en `PENDING_REVIEW`) |
| `GET /businesses` | público | Solo negocios en estado `ACTIVE` |
| `GET /businesses/manage` | `business.manage` | Todos los estados (uso administrativo) — nota: esta ruta estática va **antes** de `:id` en el controlador para no ser capturada por él |
| `PATCH /businesses/:id`, `DELETE /businesses/:id` | `business.manage` | Actualiza / soft-elimina |
| `POST /businesses/:id/approve`, `POST /businesses/:id/reject` | `business.approve` | Pasa a `ACTIVE` o `INACTIVE` — separado de `business.manage` porque aprobar es una decisión editorial distinta de administrar los datos |
| `POST/GET/DELETE /businesses/:businessId/locations` | `business.manage` (GET público) | Sedes de un negocio (municipio + dirección + coordenadas) |
| `POST/GET/DELETE /businesses/:businessId/contacts` | `business.manage` (GET público) | Contactos (teléfono/WhatsApp/email/redes) |
| `POST/GET /businesses/:businessId/subscriptions`, `PATCH .../:id/status` | `business.manage` | Plan de suscripción del negocio en el directorio (`FREE`/`BASIC`/`PREMIUM`) |
| `POST/GET/PATCH/DELETE /advertisement-campaigns`, `/advertisement-campaigns/:campaignId/advertisements`, `/advertisements/:advertisementId/placements` | `advertisement.manage` | Campañas, anuncios y ubicaciones publicitarias — **todo interno**, no público, porque incluye presupuestos |
| `POST /advertisement-placements/:id/impression`, `POST /advertisement-placements/:id/click` | **público** | Contadores atómicos (`increment`) para medir el desempeño de un anuncio; pensado para que el frontend los llame sin autenticación |

Puntos clave de este módulo:
- **Patrocinio polimórfico validado en la app**: igual que con `ContentSource`/`PersonRoleAssignment`, el servicio replica en un `switch` la misma validación que hace el trigger `business.validate_sponsorship_sponsorable` en Postgres, para devolver `400` claro en vez de un error crudo de base de datos.
- **`business.manage` vs. `business.approve`**: crear/editar un negocio y aprobarlo son permisos distintos a propósito — un rol de "moderador de directorio" puede tener solo `business.approve`.
- **Directorio público filtra por estado**: `GET /businesses` solo devuelve `ACTIVE`; el listado completo (incluidos `PENDING_REVIEW`/`INACTIVE`) vive en `GET /businesses/manage`, gateado por permiso.
- **Bug real detectado y corregido durante la verificación con curl**: `AdvertisementPlacement.impressions`/`clicks` son `BigInt` en Postgres, y `JSON.stringify` no sabe serializar `BigInt` de forma nativa — cualquier respuesta que incluyera esos campos (o el `sizeBytes` preexistente de `MediaAsset`) habría lanzado `TypeError: Do not know how to serialize a BigInt`. Se corrigió de forma global en `src/main.ts` con un `BigInt.prototype.toJSON` que serializa a string.

### Media (`/api/v1/media`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /media` | `media_asset.manage` | Sube un archivo (`multipart/form-data`: campo `file` + `festivalEditionId` opcional) a Firebase Storage |
| `GET /media/:id` | público | Metadatos del archivo (url pública, mime type, tamaño, checksum) |
| `DELETE /media/:id` | `media_asset.manage` | Soft-delete en Postgres + borrado del archivo real en Storage |

Requiere las variables `FIREBASE_*` en `.env` (ver `.env.example`) —
generarlas desde Firebase Console → Configuración del proyecto → Cuentas de
servicio → Generar nueva clave privada. Sin configurar, la app arranca igual
pero `POST /media` devuelve 500 con un mensaje explícito. Los archivos se
suben como públicos (`file.makePublic()`), acorde a que este es contenido
cultural pensado para difusión, no privado.

El storage se organiza por entidad cultural, no por fecha de subida: si se
pasa `festivalEditionId`, el archivo va a
`festivals/{slug-del-festival}/{año-de-la-edición}/{tipo}/...`; si se omite
(ej. una foto del directorio comercial que no pertenece a ninguna edición),
va a `general/{tipo}/...`.

Los tests de integración (`test/domain/*.integration-spec.ts`) verifican
directamente contra Postgres los invariantes críticos del modelo: creación
de festividades/pasos/procesiones/eventos, división de una donación entre
varios destinos, rechazo de asignaciones que superan el total, idempotencia
de transacciones de pago, auditoría automática, soft delete, y RBAC. Los
e2e (`test/app.e2e-spec.ts`) verifican el flujo HTTP completo de auth. Ambos
corren contra `TEST_DATABASE_URL` (nunca contra la base de desarrollo) y no
dejan datos residuales relevantes — ver `test/domain/test-utils.ts`.

## Documentación

| Documento | Contenido |
|---|---|
| [docs/database/README.md](./docs/database/README.md) | Punto de entrada, comandos, migraciones |
| [docs/database/ARCHITECTURE.md](./docs/database/ARCHITECTURE.md) | Decisiones de diseño y por qué |
| [docs/database/ERD.md](./docs/database/ERD.md) | Diagramas entidad-relación |
| [docs/database/FINANCIAL_MODEL.md](./docs/database/FINANCIAL_MODEL.md) | Integridad de donaciones y transparencia |
| [docs/database/HISTORICAL_MODEL.md](./docs/database/HISTORICAL_MODEL.md) | Trazabilidad de fuentes históricas |
| [docs/database/AUDIT.md](./docs/database/AUDIT.md) | Qué se audita y cómo |
| [docs/database/SECURITY.md](./docs/database/SECURITY.md) | Datos sensibles, RBAC |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Cómo contribuir, checklist de PR, comandos |
