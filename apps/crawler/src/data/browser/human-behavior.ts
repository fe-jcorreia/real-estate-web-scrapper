import type { Page } from 'playwright';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const HumanBehavior = {
  async scrollGradually(page: Page): Promise<void> {
    const scrolls = randomBetween(3, 6);
    for (let i = 0; i < scrolls; i++) {
      const distance = randomBetween(200, 500);
      await page.mouse.wheel(0, distance);
      await page.waitForTimeout(randomBetween(300, 800));
    }
  },

  async scrollToBottom(page: Page): Promise<void> {
    const height = await page.evaluate(() => document.body.scrollHeight);
    let scrolled = 0;
    while (scrolled < height) {
      const distance = randomBetween(300, 600);
      await page.mouse.wheel(0, distance);
      scrolled += distance;
      await page.waitForTimeout(randomBetween(200, 500));
    }
  },

  async randomMouseMove(page: Page): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;
    const x = randomBetween(100, viewport.width - 100);
    const y = randomBetween(100, viewport.height - 100);
    await page.mouse.move(x, y, { steps: randomBetween(5, 15) });
  },

  async idlePause(page: Page): Promise<void> {
    await page.waitForTimeout(randomBetween(10_000, 20_000));
  },

  async shortPause(page: Page): Promise<void> {
    await page.waitForTimeout(randomBetween(1_000, 3_000));
  },

  shouldIdle(interactionCount: number, every = 10): boolean {
    return interactionCount > 0 && interactionCount % every === 0;
  },
};
