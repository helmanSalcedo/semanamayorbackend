# Semana Santa de Timbío — plataforma cultural/religiosa

[![CI](https://github.com/helmanSalcedo/semanamayorbackend/actions/workflows/ci.yml/badge.svg)](https://github.com/helmanSalcedo/semanamayorbackend/actions/workflows/ci.yml)

Plataforma digital para documentar, preservar, administrar y (a futuro)
apoyar económicamente la tradición de la Semana Santa de Timbío, Cauca,
Colombia. El modelo de datos es genérico — `municipality → festival →
festival_edition` — para poder soportar otras festividades o municipios en
el futuro sin quedar acoplado a Timbío.

**Estado actual:** la base de datos está completa y en producción-ready.
Sobre ella arrancó el backend en NestJS: foundation profesional (config
validada, Prisma, logging estructurado, manejo de errores, rate limiting,
Swagger) + autenticación/RBAC reales contra el schema `auth`. Todavía no
hay endpoints de dominio (heritage, finance, cms, etc.) ni frontend — eso
es lo siguiente sobre esta base.

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
