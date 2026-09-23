# Diagrama entidad-relación

70 tablas en 9 schemas hacen inviable un solo diagrama legible. Se muestra
primero el mapa de dominios y luego un ERD detallado por dominio con las
tablas y cardinalidades más relevantes. Las relaciones polimórficas
(`*_type`/`*_id`, ver `ARCHITECTURE.md §J.1`) se marcan como líneas
punteadas conceptuales en el texto, no como FK en los diagramas Mermaid
(Mermaid no expresa "FK condicional").

## Mapa de dominios

```mermaid
erDiagram
  GEO ||--o{ HERITAGE : "municipality_id"
  HERITAGE ||--o{ OPERATIONS : "festival_edition_id"
  HERITAGE ||--o{ MEDIA : "attachable_type/id (poly)"
  HERITAGE ||--o{ CMS : "festival_id"
  HERITAGE ||--o{ FINANCE : "beneficiary_type/id (poly)"
  HERITAGE ||--o{ BUSINESS : "sponsorable_type/id (poly)"
  AUTH ||--o{ AUDIT : "user_id"
  AUTH ||--o{ CMS : "author_user_id"
  FINANCE ||--o{ AUDIT : "trigger automatico"
```

## Heritage core (festividad, patrimonio)

```mermaid
erDiagram
  MUNICIPALITY ||--o{ FESTIVAL : "1:N"
  FESTIVAL ||--o{ FESTIVAL_EDITION : "1:N"
  FESTIVAL ||--o{ PROCESSIONAL_STEP : "1:N"
  PROCESSIONAL_STEP ||--o{ RELIGIOUS_IMAGE : "1:N"
  FESTIVAL ||--o{ HISTORICAL_EVENT : "0:N"
  HISTORICAL_PERIOD ||--o{ HISTORICAL_EVENT : "0:N"
  SOURCE ||--o{ CONTENT_SOURCE : "1:N"
  PERSON ||--o{ PERSON_ROLE_ASSIGNMENT : "1:N"
  ROLE_TYPE ||--o{ PERSON_ROLE_ASSIGNMENT : "1:N"
  FAMILY ||--o{ FAMILY_PERSON : "1:N"
  PERSON ||--o{ FAMILY_PERSON : "1:N"
  MUNICIPALITY ||--o{ RELIGIOUS_SITE : "1:N"

  FESTIVAL {
    uuid id PK
    uuid municipality_id FK
    string name
    string slug UK
    enum status
  }
  FESTIVAL_EDITION {
    uuid id PK
    uuid festival_id FK
    smallint year
    string name
  }
  PROCESSIONAL_STEP {
    uuid id PK
    uuid festival_id FK
    string name
    string slug
    enum conservation_status
  }
  RELIGIOUS_IMAGE {
    uuid id PK
    uuid processional_step_id FK
    string name
    string sculptor
    decimal weight_kg
  }
  PERSON_ROLE_ASSIGNMENT {
    uuid id PK
    uuid person_id FK
    uuid role_type_id FK
    enum subject_type "poly"
    uuid subject_id "poly"
    date start_date
    date end_date
    uuid source_id FK
  }
```

## Operations (procesiones, eventos)

```mermaid
erDiagram
  FESTIVAL_EDITION ||--o{ PROCESSION : "1:N"
  PROCESSION ||--o{ PROCESSION_STEP : "1:N"
  PROCESSIONAL_STEP ||--o{ PROCESSION_STEP : "1:N"
  PROCESSION ||--o{ PROCESSION_ROUTE : "1:N"
  PROCESSION_ROUTE ||--o{ PROCESSION_ROUTE_POINT : "1:N"
  FESTIVAL_EDITION ||--o{ EVENT : "1:N"
  EVENT ||--o{ EVENT_STEP : "1:N"
  PROCESSIONAL_STEP ||--o{ EVENT_STEP : "1:N"
  EVENT ||--o{ EVENT_ORGANIZATION : "1:N"
  ORGANIZATION ||--o{ EVENT_ORGANIZATION : "1:N"
  RELIGIOUS_SITE ||--o{ EVENT : "0:N"

  PROCESSION_STEP {
    uuid procession_id FK
    uuid processional_step_id FK
    smallint order
  }
  EVENT {
    uuid id PK
    uuid festival_edition_id FK
    string title
    enum event_type
    timestamptz start_datetime
  }
```

## Finance (donaciones — el núcleo crítico)

```mermaid
erDiagram
  DONATION_CAMPAIGN ||--o{ DONATION : "0:N"
  PERSON ||--o{ DONATION : "0:N (donante, opcional)"
  DONATION ||--o{ DONATION_ALLOCATION : "1:N (suma <= amount)"
  DONATION ||--o{ PAYMENT_TRANSACTION : "1:N"
  DONATION ||--o{ DONATION_STATUS_HISTORY : "1:N"
  DONATION ||--|| DONATION_RECEIPT : "0:1"
  PAYMENT_PROVIDER ||--o{ PAYMENT_TRANSACTION : "1:N"
  FINANCIAL_CATEGORY ||--o{ FINANCIAL_TRANSACTION : "1:N"
  FINANCIAL_CATEGORY ||--o{ FINANCIAL_CATEGORY : "parent/children"

  DONATION {
    uuid id PK
    uuid campaign_id FK
    uuid donor_person_id FK "nullable"
    enum donor_visibility
    decimal amount
    enum status
  }
  DONATION_ALLOCATION {
    uuid id PK
    uuid donation_id FK
    enum beneficiary_type "poly"
    uuid beneficiary_id "poly, nullable si JUNTA"
    decimal amount
  }
  PAYMENT_TRANSACTION {
    uuid id PK
    uuid donation_id FK
    uuid provider_id FK
    string external_transaction_id UK "junto con provider_id"
    enum status
  }
  FINANCIAL_TRANSACTION {
    uuid id PK
    uuid category_id FK
    enum type "INCOME|EXPENSE"
    decimal amount
    uuid reversal_of_transaction_id FK "nullable, append-only"
  }
```

## Business (patrocinadores, directorio, publicidad)

```mermaid
erDiagram
  ORGANIZATION_TYPE ||--o{ ORGANIZATION : "1:N"
  ORGANIZATION ||--o{ SPONSORSHIP : "1:N"
  SPONSORSHIP_PACKAGE ||--o{ SPONSORSHIP : "0:N"
  DONATION_CAMPAIGN ||--o{ SPONSORSHIP : "0:N"
  BUSINESS_CATEGORY ||--o{ BUSINESS : "1:N"
  ORGANIZATION ||--o{ BUSINESS : "0:N (opcional)"
  BUSINESS ||--o{ BUSINESS_LOCATION : "1:N"
  BUSINESS ||--o{ BUSINESS_CONTACT : "1:N"
  BUSINESS ||--o{ BUSINESS_SUBSCRIPTION : "1:N"
  ORGANIZATION ||--o{ ADVERTISEMENT_CAMPAIGN : "1:N"
  ADVERTISEMENT_CAMPAIGN ||--o{ ADVERTISEMENT : "1:N"
  ADVERTISEMENT ||--o{ ADVERTISEMENT_PLACEMENT : "1:N"

  SPONSORSHIP {
    uuid id PK
    uuid organization_id FK
    enum sponsorable_type "poly"
    uuid sponsorable_id "poly"
    decimal amount
    enum status
  }
```

## Media / CMS

```mermaid
erDiagram
  MEDIA_ASSET ||--o{ MEDIA_ATTACHMENT : "1:N"
  MEDIA_ASSET ||--o{ GALLERY_ITEM : "1:N"
  GALLERY ||--o{ GALLERY_ITEM : "1:N"
  MEDIA_ASSET ||--o{ DOCUMENT : "0:N"
  SOURCE ||--o{ DOCUMENT : "0:N"
  DOCUMENT ||--o{ DOCUMENT_VERSION : "1:N"
  ARTICLE_CATEGORY ||--o{ ARTICLE : "0:N"
  ARTICLE ||--o{ ARTICLE_VERSION : "1:N"
  ARTICLE ||--o{ ARTICLE_TAG : "1:N"
  TAG ||--o{ ARTICLE_TAG : "1:N"

  MEDIA_ATTACHMENT {
    uuid id PK
    uuid media_asset_id FK
    enum attachable_type "poly"
    uuid attachable_id "poly"
    enum role
  }
```

## Auth / Audit

```mermaid
erDiagram
  USER ||--o{ USER_ROLE : "1:N"
  ROLE ||--o{ USER_ROLE : "1:N"
  ROLE ||--o{ ROLE_PERMISSION : "1:N"
  PERMISSION ||--o{ ROLE_PERMISSION : "1:N"
  USER ||--o{ SESSION : "1:N"
  USER ||--o{ REFRESH_TOKEN : "1:N"
  USER ||--o{ AUDIT_LOG : "0:N"
```

Ver `ARCHITECTURE.md` para el razonamiento detrás de cada decisión y
`prisma/schema/*.prisma` para los campos completos de cada tabla.
