# Contribuir

## Gestor de paquetes

Este proyecto usa **pnpm**, no npm ni yarn. `npm i` rompe contra la
estructura de `node_modules` que deja pnpm (ver `pnpm-lock.yaml` /
`pnpm-workspace.yaml`). Siempre:

```bash
pnpm install
pnpm add <paquete>
pnpm run <script>
```

## Antes de abrir un PR

```bash
pnpm run lint
pnpm run build
pnpm test               # unitarios, sin DB
pnpm run test:integration  # requiere TEST_DATABASE_URL migrada
pnpm run test:e2e          # idem
```

El workflow de CI (`.github/workflows/ci.yml`) corre lo mismo en cada push/PR
a `main`, incluyendo integración y e2e contra un Postgres real.

## Cambios al schema de Prisma

1. Editar el archivo correspondiente en `prisma/schema/*.prisma`
2. `npx prisma migrate dev --name <nombre_descriptivo>`
3. Si el cambio afecta invariantes de negocio (financiero, histórico, RBAC),
   sumar/actualizar tests en `test/domain/*.integration-spec.ts`
4. Actualizar la documentación relevante en `docs/database/` si el cambio
   afecta una decisión de arquitectura documentada ahí

## Datos

Nunca se cargan datos históricos inventados (nombres de pasos, fechas,
personas) vía seed — solo catálogos técnicos verificables (ver
`prisma/seed.ts` y `docs/database/HISTORICAL_MODEL.md`). Si necesitás datos
de prueba para desarrollo local, usá fixtures explícitas en tests, no el seed
compartido.

## Commits

Mensajes cortos en modo imperativo (`fix: ...`, `feat: ...`, `docs: ...`).
Sin `--no-verify` salvo que sepas exactamente por qué.
