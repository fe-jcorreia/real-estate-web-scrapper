# Business Rules

## Scraping

- One parser per real estate portal (e.g., ZAP, VivaReal, OLX)
- Each parser implements the `SiteParser` interface
- Rate limiting via configurable `REQUEST_DELAY_MS` between requests
- `MAX_CONCURRENT_PAGES` controls parallelism (default: 1 — sequential)
- Browser runs headless by default (`BROWSER_HEADLESS=true`)

## Data Integrity

- Deduplication via `(source, sourceId)` unique constraint with upsert
- All parsed listings validated with Zod `ListingSchema` before database insert
- Invalid listings are logged and skipped, not inserted
- Raw HTML saved to filesystem before parsing — enables re-parse without re-fetch

## Job Tracking

- Every scrape execution creates a `ScrapeJobEntity`
- Job status transitions: `pending → running → completed | failed`
- Counters tracked: `pagesScraped`, `listingsFound`, `listingsCreated`, `listingsUpdated`, `errors`
- Individual page/listing errors increment the error counter but do not abort the job
- Error details stored in `errorLog` JSON field

## Raw Page Storage

- HTML files saved at: `{STORAGE_PATH}/{source}/{date}/{jobId}_{pageNumber}.html`
- Each saved page creates a `RawPageEntity` linked to its job
- Storage path configurable via `STORAGE_PATH` env var

## Data Model

Required listing fields: `source`, `sourceId`, `url`, `title`
Optional fields: `price`, `areaSqm`, `bedrooms`, `bathrooms`, `parkingSpots`, `address`, `neighborhood`, `city`, `state`, `zipCode`, `latitude`, `longitude`, `description`, `propertyType`, `transactionType`, `rawData`
