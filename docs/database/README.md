# Base de datos — Semana Santa de Timbío (plataforma multi-festividad)

Documentación de la arquitectura de datos. Empieza aquí:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — decisiones de diseño,
   dominios, riesgos conocidos. Léelo primero.
2. **[ERD.md](./ERD.md)** — diagramas entidad-relación por dominio.
3. **[FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md)** — cómo se garantiza la
   integridad de donaciones/pagos/transparencia.
4. **[HISTORICAL_MODEL.md](./HISTORICAL_MODEL.md)** — cómo se documenta
   patrimonio con trazabilidad de fuentes, sin inventar datos.
5. **[AUDIT.md](./AUDIT.md)** — qué se audita y cómo.
6. **[SECURITY.md](./SECURITY.md)** — datos sensibles, RBAC, qué nunca se
   almacena.

## Resumen técnico

- PostgreSQL 18 (usa `uuidv7()` nativo).
- Prisma 6, schema partido en `prisma/schema/*.prisma` por dominio
  (`prismaSchemaFolder`), 9 schemas físicos de Postgres (`multiSchema`).
- Migraciones en `prisma/schema/migrations/`, aplicadas y versionadas —
  ver el listado en la raíz de este README para el orden.

## Migraciones (orden de aplicación)

| Migración                                      | Contenido                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `20260922194030_init`                          | Schema completo generado desde `prisma/schema/*.prisma` (70 tablas, 9 schemas)        |
| `20260922194105_check_constraints`             | `CHECK` de montos positivos, rangos de fecha/coordenadas                              |
| `20260922194139_integrity_triggers`            | Triggers de validación para las 6 relaciones polimórficas (`§J.1`)                    |
| `20260922194237_financial_integrity_and_audit` | Guardia de suma de allocations, ledger append-only, auditoría automática              |
| `20260922200408_add_municipality_foreign_keys` | FK física faltante `*.municipality_id → geo.municipality`                             |
| `20260922201142_donation_receipt_sequence`     | `SEQUENCE` + función para `donation_receipt.receipt_number`                           |
| `20260924142522_donor_tax_id`                  | Documento del donante (`donor_id_type`, `donor_id_number`) + CHECK de ambos-o-ninguno |

## Comandos

```bash
# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones pendientes (dev)
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

# Seed técnico (catálogos, sin datos históricos inventados — ver HISTORICAL_MODEL.md)
npx tsx prisma/seed.ts

# Tests de integración (requieren TEST_DATABASE_URL, una BD Postgres separada)
npm run test:integration
```

## Por qué no hay un único `schema.prisma`

El schema está en `prisma/schema/*.prisma` (uno por dominio: `01_geo`,
`02_auth`, `03_heritage_core`, `04_heritage_people`,
`05_heritage_patrimony`, `06_operations`, `07_media`, `08_cms`,
`09_finance`, `10_business`, `11_audit`) usando la feature estable
`prismaSchemaFolder` de Prisma. Con ~70 modelos, un solo archivo sería
inmanejable de revisar en un PR.
