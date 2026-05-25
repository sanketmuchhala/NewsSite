import cron from 'node-cron';
import { NewsStoryScraper } from './scrapers';
import { runDigestAgent } from './ai/digest-agent';

export function startCronJobs(): void {
  const scrapeSchedule = process.env.SCRAPE_CRON  || '0 */2 * * *';
  const digestSchedule = process.env.DIGEST_CRON  || '0 8 * * *';
  const maxPerSource   = parseInt(process.env.SCRAPE_MAX_PER_SOURCE || '15', 10);

  // ── Scrape cron ─────────────────────────────────────────────────────────────
  if (!scrapeSchedule) {
    console.log('[cron] SCRAPE_CRON is empty — scheduled scraping disabled');
  } else if (!cron.validate(scrapeSchedule)) {
    console.error(`[cron] Invalid SCRAPE_CRON: "${scrapeSchedule}" — disabled`);
  } else {
    console.log(`[cron] Scrape scheduled: ${scrapeSchedule}`);
    cron.schedule(scrapeSchedule, async () => {
      const start = Date.now();
      console.log(`[cron] Scrape starting at ${new Date().toISOString()}`);
      try {
        const scraper = new NewsStoryScraper({
          reddit: { clientId: process.env.REDDIT_CLIENT_ID, clientSecret: process.env.REDDIT_CLIENT_SECRET },
        });
        const results = await scraper.scrapeAll(maxPerSource);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[cron] Scrape done in ${elapsed}s — saved:${results.success} failed:${results.failed} total:${results.total}`);
      } catch (err) {
        console.error('[cron] Scrape failed:', err);
      }
    });
  }

  // ── Digest cron ─────────────────────────────────────────────────────────────
  if (!digestSchedule) {
    console.log('[cron] DIGEST_CRON is empty — daily digest disabled');
  } else if (!cron.validate(digestSchedule)) {
    console.error(`[cron] Invalid DIGEST_CRON: "${digestSchedule}" — disabled`);
  } else {
    console.log(`[cron] Digest scheduled: ${digestSchedule}`);
    cron.schedule(digestSchedule, async () => {
      console.log(`[cron] Digest starting at ${new Date().toISOString()}`);
      const result = await runDigestAgent();
      if (result.success) console.log(`[cron] Digest done for ${result.date}`);
      else console.error('[cron] Digest failed:', result.error);
    });
  }
}
