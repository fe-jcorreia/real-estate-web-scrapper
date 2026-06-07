import { ApplicationLayer, logger } from '@repo/core/log';
import { HttpSession, type HttpSessionConfig } from './http-session.js';

const log = { layer: ApplicationLayer.Data, method: 'quintoandar-api' };

const BASE_URL = 'https://www.quintoandar.com.br/api/yellow-pages/v2/search';

const CORE_FIELDS = ['id', 'area', 'address', 'type', 'bedrooms', 'totalCost'];
const DETAIL_FIELDS = ['id', 'bathrooms', 'salePrice', 'iptu', 'location'];
const META_FIELDS = ['id', 'suites', 'postalCode', 'regionId'];

export type BusinessContext = 'RENT' | 'SALE';
export type Availability = 'any' | 'immediate' | 'rentOnTermination';

export interface SearchParams {
  businessContext: BusinessContext;
  availability?: Availability;
  bedrooms?: number;
  bathrooms?: number;
}

export interface EsHit {
  _id: string;
  _score: number;
  _source: Record<string, unknown>;
}

export interface EsSearchResponse {
  took: number;
  hits: {
    total: { value: number; relation: string };
    max_score: number;
    hits: EsHit[];
  };
}

function buildUrl(fields: string[], params: SearchParams): string {
  const url = new URL(BASE_URL);
  for (const field of fields) {
    url.searchParams.append('return', field);
  }
  url.searchParams.set('availability', params.availability ?? 'any');
  url.searchParams.set('business_context', params.businessContext);
  if (params.bedrooms != null) {
    url.searchParams.set('bedrooms', String(params.bedrooms));
  }
  if (params.bathrooms != null) {
    url.searchParams.set('bathrooms', String(params.bathrooms));
  }
  return url.toString();
}

async function fetchGroup(
  url: string,
  headers: Record<string, string>,
  label: string,
): Promise<EsSearchResponse | null> {
  const response = await fetch(url, { headers });

  if (response.status === 408) {
    logger.warn({ ...log, message: `ES timeout (408) for ${label}, skipping group` });
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API ${response.status} for ${label}: ${body.substring(0, 200)}`);
  }

  return (await response.json()) as EsSearchResponse;
}

function mergeHits(coreHits: EsHit[], detailHits: EsHit[] | null, metaHits: EsHit[] | null): EsHit[] {
  const detailMap = new Map<string, Record<string, unknown>>();
  const metaMap = new Map<string, Record<string, unknown>>();

  if (detailHits) {
    for (const hit of detailHits) {
      detailMap.set(hit._id, hit._source);
    }
  }

  if (metaHits) {
    for (const hit of metaHits) {
      metaMap.set(hit._id, hit._source);
    }
  }

  return coreHits.map((hit) => {
    const detail = detailMap.get(hit._id);
    const meta = metaMap.get(hit._id);
    return {
      ...hit,
      _source: {
        ...hit._source,
        ...(detail ?? {}),
        ...(meta ?? {}),
      },
    };
  });
}

export interface QuintoAndarApiConfig {
  delayBetweenGroupsMs: number;
  sessionConfig?: Partial<HttpSessionConfig>;
}

const DEFAULT_CONFIG: QuintoAndarApiConfig = {
  delayBetweenGroupsMs: 500,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const QuintoAndarApiClient = {
  create(overrides?: Partial<QuintoAndarApiConfig>) {
    const config = { ...DEFAULT_CONFIG, ...overrides };
    const session = HttpSession.create(config.sessionConfig);

    return {
      get session() {
        return session;
      },

      async search(params: SearchParams): Promise<{ hits: EsHit[]; total: number }> {
        const headers = session.getHeaders();

        const coreUrl = buildUrl(CORE_FIELDS, params);
        logger.debug({ ...log, message: `Fetching core fields: ${coreUrl.substring(0, 120)}...` });

        const coreResponse = await fetchGroup(coreUrl, headers, 'core');
        if (!coreResponse) {
          return { hits: [], total: 0 };
        }

        session.incrementRequestCount();
        const total = coreResponse.hits.total.value;
        const coreHits = coreResponse.hits.hits;

        logger.info({ ...log, message: `Core: ${coreHits.length} hits (total: ${total})` });

        if (coreHits.length === 0) {
          return { hits: [], total };
        }

        await delay(config.delayBetweenGroupsMs);

        const detailUrl = buildUrl(DETAIL_FIELDS, params);
        const detailResponse = await fetchGroup(detailUrl, headers, 'detail');
        session.incrementRequestCount();

        await delay(config.delayBetweenGroupsMs);

        const metaUrl = buildUrl(META_FIELDS, params);
        const metaResponse = await fetchGroup(metaUrl, headers, 'meta');
        session.incrementRequestCount();

        const merged = mergeHits(
          coreHits,
          detailResponse?.hits.hits ?? null,
          metaResponse?.hits.hits ?? null,
        );

        logger.info({ ...log, message: `Merged ${merged.length} hits with detail/meta groups` });

        if (session.needsRotation()) {
          session.rotate();
        }

        return { hits: merged, total };
      },
    };
  },
};
