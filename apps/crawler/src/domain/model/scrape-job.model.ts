export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScrapeJobInput {
  source: string;
}

export interface ScrapeJobUpdate {
  status?: JobStatus;
  pagesScraped?: number;
  listingsFound?: number;
  listingsCreated?: number;
  listingsUpdated?: number;
  errors?: number;
  errorLog?: Record<string, unknown> | null;
  startedAt?: Date;
  completedAt?: Date;
}
