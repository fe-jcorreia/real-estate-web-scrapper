import type { Page } from 'playwright';
import { ApplicationLayer, logger } from '@repo/core/log';
import { HumanBehavior } from '../../data/browser/human-behavior.js';

const log = { layer: ApplicationLayer.Domain, method: 'pagination' };

const LOAD_MORE_SELECTOR = 'button[data-testid="see-more-button"], button:has-text("Ver mais")';
const LISTING_CARD_SELECTOR = 'a[href*="/imovel/"]';

export const PaginationStrategy = {
  async loadAllListings(page: Page, maxPages = 100): Promise<number> {
    let loadMoreClicks = 0;
    let previousCount = 0;

    while (loadMoreClicks < maxPages) {
      const currentCount = await page.locator(LISTING_CARD_SELECTOR).count();
      logger.debug({ ...log, message: `Page has ${currentCount} listings after ${loadMoreClicks} clicks` });

      if (currentCount === previousCount && loadMoreClicks > 0) {
        logger.info({ ...log, message: `No new listings loaded, stopping pagination at ${currentCount} listings` });
        break;
      }
      previousCount = currentCount;

      await HumanBehavior.scrollGradually(page);
      await HumanBehavior.randomMouseMove(page);

      const loadMoreButton = page.locator(LOAD_MORE_SELECTOR).first();
      const isVisible = await loadMoreButton.isVisible().catch(() => false);

      if (!isVisible) {
        logger.info({ ...log, message: `"Ver mais" button not found, all ${currentCount} listings loaded` });
        break;
      }

      await HumanBehavior.shortPause(page);
      await loadMoreButton.scrollIntoViewIfNeeded();
      await HumanBehavior.shortPause(page);
      await loadMoreButton.click();
      loadMoreClicks++;

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle').catch(() => {});

      logger.info({ ...log, message: `Clicked "Ver mais" (${loadMoreClicks}/${maxPages})` });

      if (HumanBehavior.shouldIdle(loadMoreClicks)) {
        await HumanBehavior.idlePause(page);
      }
    }

    const totalListings = await page.locator(LISTING_CARD_SELECTOR).count();
    logger.info({ ...log, message: `Pagination complete: ${totalListings} listings loaded in ${loadMoreClicks} clicks` });
    return totalListings;
  },

  async getPageHtml(page: Page): Promise<string> {
    return page.content();
  },
};
