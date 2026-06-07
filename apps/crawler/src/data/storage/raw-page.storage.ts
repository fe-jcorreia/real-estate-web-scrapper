import fs from 'node:fs/promises';
import path from 'node:path';
import { ApplicationLayer, logger } from '@repo/core/log';
import { Env } from '../../env/index.js';

const log = { layer: ApplicationLayer.Data, method: 'storage' };

export const RawPageStorage = {
  async saveJson(source: string, jobId: string, bucketLabel: string, data: unknown): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const dir = path.join(Env.STORAGE_PATH, source, date!);
    await fs.mkdir(dir, { recursive: true });

    const safeBucket = bucketLabel.replace(/\s+/g, '_').toLowerCase();
    const filePath = path.join(dir, `${jobId}_${safeBucket}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.debug({ ...log, message: `Saved raw JSON to ${filePath}` });

    return filePath;
  },
};
