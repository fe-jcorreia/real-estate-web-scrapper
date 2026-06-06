export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScrapeJobInput {
  source: string;
  totalPages?: number;
}

export interface ScrapeJobUpdate {
  status?: JobStatus;
  pagesScraped?: number;
  listingsFound?: number;
  listingsNew?: number;
  errors?: unknown[];
  startedAt?: Date;
  completedAt?: Date;
}
