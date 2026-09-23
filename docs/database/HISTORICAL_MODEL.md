# Modelo de contenido histórico

Principio rector del spec original: **nunca inventar información
histórica**; toda afirmación debe poder enlazarse a una fuente.

## Entidades

- `heritage.source` — la fuente en sí (libro, periódico, acta, foto antigua,
  archivo institucional, testimonio oral...) con `sourceType`,
  `reliabilityNotes`, referencia de archivo/ISBN/URL cuando aplique.
- `heritage.content_source` — tabla puente **polimórfica** que cita una
  fuente desde cualquier contenido (`sourceableType` +
  `sourceableId`: `HISTORICAL_EVENT`, `PERSON`, `PROCESSIONAL_STEP`,
  `RELIGIOUS_IMAGE`, `EVENT`, `RELIGIOUS_SITE`, `DOCUMENT`, `FAMILY`), con
  `citationNote` para la cita textual o el fragmento relevante.
- `heritage.historical_event` — hecho histórico discreto, con
  `datePrecision` (`EXACT`/`YEAR`/`DECADE`/`CIRCA`/`UNKNOWN` — las fechas
  históricas suelen ser aproximadas, no se fuerza una fecha exacta ficticia)
  y `reliabilityLevel` (`VERIFIED`/`PROBABLE`/`DISPUTED`/`LEGENDARY`).
- `heritage.historical_period` — agrupa eventos por periodo (ej. "Fundación
  del municipio", "Siglo XX").
- `media.document` (+ `document_version`) — cubre lo que el spec llamaba
  `historical_document`: libros, actas, manuscritos, fotos antiguas, PDFs,
  con versionado (`document_version.snapshot` en JSON, `changeSummary`,
  `changedByUserId`) para saber quién modificó qué y cuándo.

## Por qué no hay tablas `historical_person`/`historical_place` separadas

Ver `ARCHITECTURE.md §C.3`. Resumen: una persona o un lugar pueden ser
simultáneamente "activos hoy" y "documentados históricamente" — separar la
tabla obligaría a decidir de antemano en cuál poner cada registro y a
duplicar cuando cambia de categoría. En su lugar:

- `heritage.person.isHistoricalOnly: Boolean` + `biographyText` cubren el
  caso de una figura exclusivamente histórica.
- `heritage.religious_site.type = SITIO_HISTORICO` cubre lugares históricos
  que no son necesariamente sitios religiosos activos.
- La trazabilidad de fuente es igual para ambos casos: vía
  `content_source`.

## Personas y roles con vigencia

`heritage.person_role_assignment` (ver `ARCHITECTURE.md §C.4`) responde
"¿quién fue síndico del Paso X entre 2015 y 2019?" con:
`personId`, `roleTypeId` (catálogo administrable: síndico, carguero,
sahumadora, músico, restaurador, historiador, sacerdote, organizador,
benefactor, autor, fotógrafo...), `subjectType`/`subjectId` (a qué está
vinculado: paso, festividad, edición, evento, hecho histórico, sitio
religioso), `startDate`/`endDate`, `notes`, `sourceId`.

## Familias

`heritage.family` + `family_person` (con `relationshipNote` y `sourceId`
opcional). **Nunca se asume un parentesco sin fuente** — la columna
`sourceId` es opcional a nivel de base de datos (para no bloquear el primer
borrador de un árbol genealógico en construcción) pero se exige a nivel de
aplicación antes de publicar el vínculo como un hecho verificado.

## Derechos de patrimonio

Ver `ARCHITECTURE.md §H` y `heritage.content_rights` — separado de
`content_source` porque una cosa es "de dónde sale la información" (fuente)
y otra "quién tiene el derecho de reproducir esta foto/documento" (derechos
de autor/licencia).

## Datos de ejemplo (seed)

`prisma/seed.ts` **no** crea ninguna festividad, paso procesional, persona,
familia, ni fecha histórica de Timbío — solo catálogos técnicos (roles RBAC,
tipos de rol cultural, categorías financieras/de negocio, proveedores de
pago, país/departamento/municipio). La entidad `Festival` para "Semana Santa
de Timbío" y todo su contenido patrimonial deben cargarse desde el panel
administrativo (cuando exista) por alguien con conocimiento verificable del
tema, citando fuente para cada afirmación — nunca como seed automático.
