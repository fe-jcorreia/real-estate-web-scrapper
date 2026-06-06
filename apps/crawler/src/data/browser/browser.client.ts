import { chromium, type Browser, type Page } from 'playwright';
import { ApplicationLayer, logger } from '@repo/core/log';
import { Env } from '../../env/index.js';

const log = { layer: ApplicationLayer.Data, method: 'browser' };

let browser: Browser | null = null;

export const BrowserClient = {
  async launch() {
    if (browser) return;
    logger.info({ ...log, message: `Launching browser (headless: ${Env.BROWSER_HEADLESS})` });
    browser = await chromium.launch({ headless: Env.BROWSER_HEADLESS });
  },

  async newPage(): Promise<Page> {
    if (!browser) await this.launch();
    return browser!.newPage();
  },

  async fetchPageContent(url: string): Promise<string> {
    const page = await this.newPage();
    try {
      logger.debug({ ...log, message: `Navigating to ${url}` });
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
      return await page.content();
    } finally {
      await page.close();
    }
  },

  async close() {
    if (browser) {
      await browser.close();
      browser = null;
      logger.info({ ...log, message: 'Browser closed' });
    }
  },
};
