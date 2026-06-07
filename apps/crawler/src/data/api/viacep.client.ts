import { ApplicationLayer, logger } from '@repo/core/log';

const log = { layer: ApplicationLayer.Data, method: 'viacep' };

export interface ViaCepResult {
  neighborhood: string | undefined;
  city: string | undefined;
  state: string | undefined;
}

interface ViaCepResponse {
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

const cache = new Map<string, ViaCepResult>();

function sanitizeCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

export const ViaCepClient = {
  async lookup(rawCep: string): Promise<ViaCepResult> {
    const cep = sanitizeCep(rawCep);
    if (cep.length !== 8) {
      return { neighborhood: undefined, city: undefined, state: undefined };
    }

    const cached = cache.get(cep);
    if (cached) return cached;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        logger.warn({ ...log, message: `ViaCEP ${response.status} for CEP ${cep}` });
        return { neighborhood: undefined, city: undefined, state: undefined };
      }

      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        logger.debug({ ...log, message: `CEP ${cep} not found in ViaCEP` });
        const empty: ViaCepResult = { neighborhood: undefined, city: undefined, state: undefined };
        cache.set(cep, empty);
        return empty;
      }

      const result: ViaCepResult = {
        neighborhood: data.bairro || undefined,
        city: data.localidade || undefined,
        state: data.uf || undefined,
      };

      cache.set(cep, result);
      return result;
    } catch (err) {
      logger.warn({ ...log, message: `ViaCEP request failed for CEP ${cep}: ${err}` });
      return { neighborhood: undefined, city: undefined, state: undefined };
    }
  },

  getCacheSize(): number {
    return cache.size;
  },

  clearCache(): void {
    cache.clear();
  },
};
