# Feature: Project Bootstrap

## Overview

Transform the Taqtile/Indigotech Node.js monorepo template into a real estate web scraper project. Remove all template identification, strip unused modules, create the crawler app skeleton, and establish project specs.

## Prerequisites

- [x] Existing Taqtile monorepo template with Turborepo, Prisma, Fastify

## Acceptance Criteria

- [x] All Taqtile/Indigotech references removed
- [x] Unused modules removed from core package (security, localization, pagination)
- [x] Rest-server cleaned — auth/users removed, Fastify skeleton kept
- [x] Crawler app created with Clean Architecture layers
- [x] Prisma schema updated with ListingEntity, ScrapeJobEntity, RawPageEntity
- [x] Docker updated to Postgres 17 with healthcheck and named volume
- [x] Node 22 LTS configured
- [x] Project specs created (architecture, code-standards, business-rules)
- [x] CLAUDE.md created with project conventions

## Implementation Steps

1. Remove Taqtile files (cloudbuild, sonar, Procfile, CODEOWNERS)
2. Rewrite README, LICENSE, root package.json
3. Strip core package (security, localization, pagination, test-server)
4. Clean rest-server (auth, users, settings, JWT config)
5. Create crawler app skeleton (domain, data, parsers, env)
6. Update Prisma schema for real estate domain
7. Update Docker and environment config
8. Update root configs (.nvmrc, .gitignore, CI workflow)
9. Create specs directory with architecture, standards, and rules
10. Create CLAUDE.md

## Status: Complete
