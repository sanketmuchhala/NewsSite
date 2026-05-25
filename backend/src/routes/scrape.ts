import { Router, Request, Response } from 'express';
import { NewsStoryScraper } from '../scrapers';
import { adminGetStories, adminUpsertStory } from '../firebase/firestore-admin';
import { geminiClient } from '../ai/gemini';
import { fetchArticleText, extractReadableSummary } from '../scrapers/article-extractor';

const router = Router();

function makeScraper() {
  return new NewsStoryScraper({
    reddit: {
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
    },
  });
}

// POST /api/scrape  — run full scrape
router.post('/', async (req: Request, res: Response) => {
  try {
    const { maxPerSource = 15 } = req.body ?? {};
    console.log('Scrape triggered via API…', { maxPerSource });
    const results = await makeScraper().scrapeAll(maxPerSource);
    return res.json({
      success: true,
      message: `Scraped: ${results.success} saved, ${results.failed} failed out of ${results.total}`,
      results,
      aiEnabled: !!process.env.GEMINI_API_KEY,
    });
  } catch (error: any) {
    console.error('Scrape failed:', error);
    return res.status(500).json({ success: false, error: error?.message ?? 'Scrape failed' });
  }
});

// GET /api/scrape/status
router.get('/status', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    sources: {
      reddit: { enabled: true },
      rss:    { enabled: true, feedCount: 30 },
      hackernews: { enabled: true },
      twitter: { enabled: false, reason: 'Requires paid API credentials' },
    },
    ai: { enabled: !!process.env.GEMINI_API_KEY },
    db: { type: 'firestore', connected: !!process.env.FIREBASE_PROJECT_ID },
    cron: { schedule: process.env.SCRAPE_CRON || '0 */2 * * *' },
  });
});

// POST /api/scrape/enhance  — re-enhance existing stories with better AI summaries
router.post('/enhance', async (req: Request, res: Response) => {
  try {
    const { limit = 20, force = false } = req.body ?? {};

    const result = await adminGetStories(limit as number, 'scraped_at');
    if (!result.success || !result.data) {
      return res.status(500).json({ success: false, error: 'Failed to fetch stories' });
    }

    const needsWork = force
      ? result.data
      : result.data.filter(
          s => !s.content || s.content.length < 100 || s.summary === s.title || (s.summary?.length ?? 0) < 80,
        );

    const stats = { updated: 0, failed: 0, skipped: result.data.length - needsWork.length };

    for (const story of needsWork) {
      try {
        const articleText = await fetchArticleText(story.url);
        if (!articleText) { stats.failed++; continue; }

        let summary: string | null = null;
        try {
          summary = await geminiClient.generateNewsStoryAnalysis(
            story.title, story.source, story.tags || [], articleText,
          );
        } catch { /* Gemini quota */ }

        if (!summary) summary = extractReadableSummary(articleText, story.title);

        await adminUpsertStory(story.slug!, {
          content: articleText,
          summary: summary || story.summary,
          metadata: {
            ...story.metadata,
            content_fetched_at: new Date().toISOString(),
            ai_enhanced: !!summary,
          },
        });
        stats.updated++;
        await new Promise(r => setTimeout(r, 300));
      } catch {
        stats.failed++;
      }
    }

    return res.json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message ?? 'Enhance failed' });
  }
});

export default router;
