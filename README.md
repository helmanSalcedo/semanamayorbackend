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

### Vínculos genéricos de media (`/api/v1/media-attachments`)

| Endpoint | Permiso | Descripción |
|---|---|---|
| `POST /media-attachments` | `media_asset.manage` | Vincula un `MediaAsset` ya subido a cualquier entidad (festival, paso, imagen, sitio, evento, persona, artículo, documento) |
| `GET /media-attachments?attachableType=X&attachableId=Y` | público | Lista los archivos vinculados a una entidad |
| `DELETE /media-attachments/:id` | `media_asset.manage` | Quita el vínculo (no borra el archivo) |

Valida en la capa de aplicación que la entidad exista antes de tocar la DB —
espeja el trigger `media.validate_media_attachment_attachable` para devolver
un 400 claro en vez de un 500 opaco si algo no cuadra.

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
