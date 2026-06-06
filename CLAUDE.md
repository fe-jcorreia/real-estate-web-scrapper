# Real Estate Web Scrapper

Local web scraper for Brazilian real estate portals. Crawls listing sites, extracts structured data, and stores it in PostgreSQL for analysis.

## Quick Reference

```bash
# Setup
docker compose up -d          # Start Postgres 17
npm ci                        # Install dependencies
npm run db:codegen             # Generate Prisma client
npm run migrate:deploy         # Run migrations (or migrate:generate for new ones)
npm run build                  # Build all packages

# Development
npm run dev                    # Watch mode (all workspaces)
npm run crawl                  # Run crawler

# Quality
npm run lint                   # Biome lint
npm run test                   # Run all tests
npm run typecheck              # TypeScript check
npm run packages:check         # Syncpack version consistency
```

## Project Structure

Turborepo monorepo — `apps/*` for applications, `packages/*` for shared libraries. See `specs/architecture.md` for full details.

## Specs

All code patterns, architecture decisions, and business rules are in `specs/`:
- `specs/architecture.md` — monorepo structure, clean architecture layers, key patterns
- `specs/code-standards.md` — naming, formatting, error handling, logging, validation
- `specs/business-rules.md` — scraping rules, deduplication, job tracking, storage
- `specs/feature-template.md` — template for planning new features

**Always read the relevant spec before implementing.** New features should start from a copy of `specs/feature-template.md` placed in `specs/features/`.

## Key Conventions

- ESM everywhere (`"type": "module"`, `.js` import extensions)
- Module-level function objects, not classes
- Zod validation for all external data
- Biome: single quotes, 2-space indent, 120 char width
- Prefixed IDs: `l_` listings, `j_` jobs, `rp_` raw pages
- Winston structured logging with `ApplicationLayer` enum
- Integration tests use real database, not mocks
