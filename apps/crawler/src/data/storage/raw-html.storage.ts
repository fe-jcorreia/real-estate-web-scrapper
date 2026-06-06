import fs from 'node:fs/promises';
import path from 'node:path';
import { ApplicationLayer, logger } from '@repo/core/log';
import { Env } from '../../env/index.js';

const log = { layer: ApplicationLayer.Data, method: 'storage' };

export const RawHtmlStorage = {
  async save(source: string, jobId: string, pageNumber: number, html: string): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const dir = path.join(Env.STORAGE_PATH, source, date!);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${jobId}_${pageNumber}.html`);
    await fs.writeFile(filePath, html, 'utf-8');
    logger.debug({ ...log, message: `Saved raw HTML to ${filePath}` });

    return filePath;
  },
};
