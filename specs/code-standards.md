# Code Standards

## File Naming

kebab-case with qualifiers indicating layer:
- `listings.db.datasource.ts` — data layer, database
- `browser.client.ts` — data layer, external client
- `scrape.use-case.ts` — domain layer, use case
- `listing.model.ts` — domain layer, model
- `env-schema.ts` — environment schema

## TypeScript

- Strict mode, ESM (`"type": "module"`)
- `.js` extensions in all relative imports (required for ESM)
- No path aliases in crawler (no bundler) — use relative imports
- Prefer `type` imports: `import type { X } from ...`
- No classes — use module-level function objects: `export const X = { fn1, fn2 }`

## Formatting (Biome)

- Single quotes
- 2-space indentation
- 120 character line width
- Trailing commas
- Run: `npm run lint`

## Error Handling

- Extend `BaseError` hierarchy from `@repo/core/error`
- Custom errors: `DataSourceError`, `ParseError`, `NavigationError`
- Individual page errors do not abort the entire scrape job
- Log errors with structured Winston logging

## Logging

Winston structured logger from `@repo/core/log`:
```typescript
import { ApplicationLayer, logger } from '@repo/core/log';
const log = { layer: ApplicationLayer.Data, method: 'datasource-name' };
logger.info({ ...log, message: 'Description' });
```

## Validation

- Zod for all external data (env vars, parsed HTML data)
- Validate before database insert
- Schema and inferred type co-located in model files

## IDs

`DatabaseIdGenerator.generate(prefix)` from `@repo/db`:
- `l_` — listings
- `j_` — scrape jobs
- `rp_` — raw pages

## Testing

- Mocha + Chai
- Test files: `*.test.ts` co-located with source
- Integration tests hit real database (no mocks for DB)
