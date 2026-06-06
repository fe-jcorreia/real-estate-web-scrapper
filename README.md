# Real Estate Web Scrapper

Web scraper for real estate listings (buy/rent) from Brazilian property portals. Runs locally, stores data in PostgreSQL via Docker.

## Tech Stack

- **Runtime**: Node.js 22 LTS + TypeScript
- **Monorepo**: Turborepo + npm workspaces
- **Database**: PostgreSQL 17 + Prisma ORM
- **Browser Automation**: Playwright
- **Linting/Formatting**: Biome
- **Validation**: Zod

## Project Structure

```
apps/
  crawler/          # CLI scraper application
  rest-server/      # REST API for querying scraped data (Fastify)
packages/
  core/             # Shared utilities (errors, logging, HTTP client)
  db/               # Prisma schema, client, migrations
  env/              # Environment variable loading and validation
  tsconfig/         # Shared TypeScript configuration
specs/              # Project specifications and feature plans
```

## Setup

```bash
nvm use                       # Use the correct Node version
docker compose up -d          # Start PostgreSQL
npm install                   # Install dependencies
npm run migrate:deploy        # Run database migrations
npm run build                 # Build all packages and apps
```

## Scripts

```bash
npm run build                 # Build all packages and apps
npm run dev                   # Run in development mode (watch)
npm run test                  # Run tests
npm run lint                  # Lint with Biome
npm run migrate:generate      # Generate new Prisma migration
npm run migrate:deploy        # Apply pending migrations
npm run migrate:reset         # Reset database and re-apply migrations
```

## Specs

Project specifications are in the `specs/` directory:

- `specs/architecture.md` - System architecture and patterns
- `specs/code-standards.md` - Code conventions and standards
- `specs/business-rules.md` - Scraping rules and data model
- `specs/feature-template.md` - Template for feature planning
