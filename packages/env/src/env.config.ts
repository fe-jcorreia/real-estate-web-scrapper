import type { ZodType } from 'zod';

export interface EnvProvider {
  load(): Promise<Record<string, string>>;
}

interface SetupOptions<TSchema> {
  schema: ZodType<TSchema>;
  providers: EnvProvider[];
}

export class EnvConfig<TSchema> {
  private options: SetupOptions<TSchema>;
  private envs: TSchema;

  constructor(options: SetupOptions<TSchema>) {
    this.options = options;
  }

  async setup() {
    const rawConfig: Record<string, unknown> = process.env;

    for (const provider of this.options.providers) {
      const config = await provider.load();
      Object.assign(rawConfig, config);
    }

    try {
      this.envs = this.options.schema.parse(rawConfig);
    } catch (error) {
      throw new Error(`Env config validation error: ${error.message}`);
    }
  }

  getEnv(): TSchema {
    return this.envs;
  }
}
