# Architecture

## Monorepo Structure

Turborepo with npm workspaces. Two categories:

```
apps/           # Deployable applications
  crawler/      # CLI scraper - Playwright + parsers
  rest-server/  # Fastify API skeleton (future data queries)

packages/       # Shared libraries
  core/         # Error hierarchy, logging (Winston), HTTP client, context (AsyncLocalStorage)
  db/           # Prisma client, schema, migrations, ID generation
  env/          # Environment config with Zod validation (DotEnvStrategy)
  tsconfig/     # Shared TypeScript configs
```

## Clean Architecture (Crawler)

```
parsers/     → Domain-specific HTML parsing (one per site)
domain/      → Business logic, models, use cases, Zod schemas
data/        → External I/O (database, browser, filesystem)
env/         → Environment configuration
```

**Dependency direction**: `index.ts → crawler.config → domain ← data ← parsers`

Parsers depend on domain models (ListingInput). Domain never imports from data or parsers directly — use cases receive dependencies as function arguments.

## Key Patterns

- **Module-level function objects** (not classes): `export const XDatasource = { method1, method2 }`
- **Barrel exports**: every directory has an `index.ts` re-exporting public API
- **Prefixed IDs**: `DatabaseIdGenerator.generate(prefix)` — `l_` listings, `j_` jobs, `rp_` raw pages
- **Raw HTML preserved**: saved to filesystem before parsing, enabling re-parse without re-fetch
- **ESM throughout**: `"type": "module"`, `.js` extensions in imports

## Database

PostgreSQL via Prisma ORM. Three entities:
- `ListingEntity` — real estate listing data, deduplicated by `(source, sourceId)`
- `ScrapeJobEntity` — job execution tracking with counters and status
- `RawPageEntity` — record of saved HTML files, linked to jobs
