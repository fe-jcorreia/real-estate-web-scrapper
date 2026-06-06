import { ApplicationLayer, logger } from '@repo/core/log';

const log = { layer: ApplicationLayer.Domain, method: 'rate-limiter' };

export interface RateLimiterConfig {
  baseDelayMs: number;
  jitterPercent: number;
  batchSize: number;
  batchPauseMs: number;
  maxPagesPerSession: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  baseDelayMs: 4000,
  jitterPercent: 30,
  batchSize: 50,
  batchPauseMs: 45_000,
  maxPagesPerSession: 200,
};

function applyJitter(baseMs: number, jitterPercent: number): number {
  const jitter = baseMs * (jitterPercent / 100);
  return Math.floor(baseMs + (Math.random() * 2 - 1) * jitter);
}

export const RateLimiter = {
  create(overrides?: Partial<RateLimiterConfig>) {
    const config = { ...DEFAULT_CONFIG, ...overrides };
    let requestCount = 0;

    return {
      get requestCount() {
        return requestCount;
      },

      async wait(): Promise<void> {
        requestCount++;

        if (requestCount > 0 && requestCount % config.batchSize === 0) {
          const pauseMs = applyJitter(config.batchPauseMs, config.jitterPercent);
          logger.info({ ...log, message: `Batch pause after ${requestCount} requests (${(pauseMs / 1000).toFixed(1)}s)` });
          await delay(pauseMs);
          return;
        }

        const delayMs = applyJitter(config.baseDelayMs, config.jitterPercent);
        logger.debug({ ...log, message: `Waiting ${delayMs}ms before next request` });
        await delay(delayMs);
      },

      needsSessionRotation(): boolean {
        return requestCount >= config.maxPagesPerSession;
      },

      resetCount(): void {
        requestCount = 0;
      },

      async blockingPause(durationMs: number): Promise<void> {
        logger.warn({ ...log, message: `Blocking pause for ${(durationMs / 1000).toFixed(0)}s (possible rate limit)` });
        await delay(durationMs);
      },
    };
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
