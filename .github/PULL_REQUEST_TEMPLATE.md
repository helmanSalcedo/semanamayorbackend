## Qué cambia y por qué

<!-- Resumen breve. Si cierra un issue: Closes #123 -->

## Checklist

- [ ] `pnpm run lint` y `pnpm run build` pasan localmente
- [ ] `pnpm test` (unitarios) pasa
- [ ] Si tocaste `prisma/schema/**`: agregaste la migración (`prisma migrate dev`) y corriste `pnpm run test:integration` / `pnpm run test:e2e`
- [ ] Si agregaste una env var: la sumaste a `.env.example` (y al workflow de CI si hace falta)
- [ ] Si el cambio afecta el modelo de datos o las decisiones de arquitectura: actualizaste `docs/database/*`
- [ ] No hay secretos ni datos reales de personas/donaciones en el diff

## Cómo probarlo

<!-- Pasos manuales si aplica, o "cubierto por tests" -->
