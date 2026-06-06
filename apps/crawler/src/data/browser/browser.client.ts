import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { ApplicationLayer, logger } from '@repo/core/log';
import { Env } from '../../env/index.js';
import { StealthConfig } from './stealth.config.js';

const log = { layer: ApplicationLayer.Data, method: 'browser' };

let browser: Browser | null = null;
let context: BrowserContext | null = null;

export const BrowserClient = {
  async launch() {
    if (browser) return;
    logger.info({ ...log, message: `Launching browser (headless: ${Env.BROWSER_HEADLESS})` });
    browser = await chromium.launch({
      headless: Env.BROWSER_HEADLESS,
      args: StealthConfig.launchArgs(),
    });
    await this.rotateContext();
  },

  async rotateContext() {
    if (context) {
      await context.close();
      logger.info({ ...log, message: 'Rotated browser context' });
    }
    if (!browser) await this.launch();
    context = await browser!.newContext(StealthConfig.contextOptions());
  },

  async newPage(): Promise<Page> {
    if (!context) await this.launch();
    return context!.newPage();
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
    if (context) {
      await context.close();
      context = null;
    }
    if (browser) {
      await browser.close();
      browser = null;
      logger.info({ ...log, message: 'Browser closed' });
    }
  },
};
