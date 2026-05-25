import cron from 'node-cron';
import { NewsStoryScraper } from './scrapers';

export function startCronJobs(): void {
  const schedule = process.env.SCRAPE_CRON || '0 */2 * * *';
  const maxPerSource = parseInt(process.env.SCRAPE_MAX_PER_SOURCE || '15', 10);

  if (!schedule) {
    console.log('[cron] SCRAPE_CRON is empty — scheduled scraping disabled');
    return;
  }

  if (!cron.validate(schedule)) {
    console.error(`[cron] Invalid cron expression: "${schedule}" — scheduled scraping disabled`);
    return;
  }

  console.log(`[cron] Scheduled scraping every: ${schedule}`);

  cron.schedule(schedule, async () => {
    const start = Date.now();
    console.log(`[cron] Starting scheduled scrape at ${new Date().toISOString()}`);
    try {
      const scraper = new NewsStoryScraper({
        reddit: {
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
        },
      });
      const results = await scraper.scrapeAll(maxPerSource);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `[cron] Done in ${elapsed}s — saved:${results.success} failed:${results.failed} total:${results.total}`,
      );
    } catch (err) {
      console.error('[cron] Scheduled scrape failed:', err);
    }
  });
}
