import { ApplicationLayer, logger } from '@repo/core/log';

const log = { layer: ApplicationLayer.Domain, method: 'retry' };

export type BlockReason = 'rate-limit' | 'forbidden' | 'captcha' | 'timeout' | 'unknown';

export interface RetryConfig {
  maxRetries: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  rateLimitPauseMs: number;
  forbiddenPauseMs: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseBackoffMs: 2000,
  maxBackoffMs: 30_000,
  rateLimitPauseMs: 300_000,
  forbiddenPauseMs: 600_000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoff(attempt: number, baseMs: number, maxMs: number): number {
  const backoff = baseMs * 2 ** attempt;
  return Math.min(backoff, maxMs);
}

export function detectBlockReason(error: unknown): BlockReason {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'rate-limit';
  }
  if (lower.includes('403') || lower.includes('forbidden') || lower.includes('access denied')) {
    return 'forbidden';
  }
  if (lower.includes('captcha') || lower.includes('challenge') || lower.includes('recaptcha')) {
    return 'captcha';
  }
  if (lower.includes('408') || lower.includes('timeout') || lower.includes('timed out')) {
    return 'timeout';
  }
  return 'unknown';
}

export const RetryStrategy = {
  create(overrides?: Partial<RetryConfig>) {
    const config = { ...DEFAULT_CONFIG, ...overrides };

    return {
      async execute<T>(fn: () => Promise<T>, label: string): Promise<T> {
        let lastError: unknown;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
          try {
            return await fn();
          } catch (error) {
            lastError = error;
            const reason = detectBlockReason(error);

            if (attempt === config.maxRetries) {
              logger.error({ ...log, message: `All ${config.maxRetries} retries exhausted for ${label}`, error });
              break;
            }

            if (reason === 'captcha') {
              logger.warn({ ...log, message: `Captcha detected on ${label}, skipping (not retryable)` });
              break;
            }

            if (reason === 'rate-limit') {
              logger.warn({ ...log, message: `Rate limited on ${label}, pausing ${config.rateLimitPauseMs / 1000}s` });
              await delay(config.rateLimitPauseMs);
              continue;
            }

            if (reason === 'forbidden') {
              logger.warn({ ...log, message: `Forbidden on ${label}, pausing ${config.forbiddenPauseMs / 1000}s` });
              await delay(config.forbiddenPauseMs);
              continue;
            }

            const backoff = computeBackoff(attempt, config.baseBackoffMs, config.maxBackoffMs);
            logger.warn({
              ...log,
              message: `Retry ${attempt + 1}/${config.maxRetries} for ${label} in ${backoff}ms (${reason})`,
            });
            await delay(backoff);
          }
        }

        throw lastError;
      },
    };
  },
};
