import { DataSourceError } from '@repo/core/error';

export const SCRAPE_ERRORS = {
  PARSE_ERROR: { code: 'SCR_01', message: 'Failed to parse page content' },
  NAVIGATION_ERROR: { code: 'SCR_02', message: 'Failed to navigate to page' },
  RATE_LIMIT_ERROR: { code: 'SCR_03', message: 'Rate limited by target site' },
  STORAGE_ERROR: { code: 'SCR_04', message: 'Failed to save raw HTML' },
  VALIDATION_ERROR: { code: 'SCR_05', message: 'Parsed data failed validation' },
} as const;

export class ParseError extends DataSourceError {
  constructor(details?: unknown) {
    super({ ...SCRAPE_ERRORS.PARSE_ERROR, details });
  }
}

export class NavigationError extends DataSourceError {
  constructor(details?: unknown) {
    super({ ...SCRAPE_ERRORS.NAVIGATION_ERROR, details });
  }
}
