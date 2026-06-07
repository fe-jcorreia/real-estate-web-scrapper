import { ApplicationLayer, logger } from '@repo/core/log';

const log = { layer: ApplicationLayer.Data, method: 'http-session' };

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export interface HttpSessionConfig {
  maxRequestsPerSession: number;
}

const DEFAULT_CONFIG: HttpSessionConfig = {
  maxRequestsPerSession: 500,
};

export const HttpSession = {
  create(overrides?: Partial<HttpSessionConfig>) {
    const config = { ...DEFAULT_CONFIG, ...overrides };
    let userAgent = pickRandom(USER_AGENTS);
    let requestCount = 0;

    logger.info({ ...log, message: `Session created with UA: ${userAgent.substring(0, 50)}...` });

    return {
      getHeaders(referer?: string): Record<string, string> {
        return {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': referer ?? 'https://www.quintoandar.com.br/alugar/imovel/sao-paulo-sp-brasil',
          'Origin': 'https://www.quintoandar.com.br',
          'User-Agent': userAgent,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Connection': 'keep-alive',
        };
      },

      incrementRequestCount(): void {
        requestCount++;
      },

      needsRotation(): boolean {
        return requestCount >= config.maxRequestsPerSession;
      },

      rotate(): void {
        userAgent = pickRandom(USER_AGENTS);
        requestCount = 0;
        logger.info({ ...log, message: `Session rotated, new UA: ${userAgent.substring(0, 50)}...` });
      },

      get requestCount() {
        return requestCount;
      },
    };
  },
};
