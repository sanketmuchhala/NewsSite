import { Router, Request, Response } from 'express';
import { NewsStoryScraper } from '../scrapers';
import { adminGetStories, adminUpsertStory, adminGetFeedRuns } from '../firebase/firestore-admin';
import { llmClient } from '../ai/llm';
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
      ai: {
        groq: !!process.env.GROQ_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
      },
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
      reddit:     { enabled: true },
      rss:        { enabled: true, feedCount: 30 },
      hackernews: { enabled: true },
      twitter:    { enabled: false, reason: 'Requires paid API credentials' },
    },
    ai: {
      groq:   { enabled: !!process.env.GROQ_API_KEY,   model: 'llama-3.3-70b-versatile' },
      gemini: { enabled: !!process.env.GEMINI_API_KEY, model: 'gemini-2.0-flash', role: 'fallback' },
    },
    db:   { type: 'firestore', connected: !!process.env.FIREBASE_PROJECT_ID },
    cron: { schedule: process.env.SCRAPE_CRON || '0 */2 * * *' },
  });
});

// POST /api/scrape/enhance  — re-enhance existing stories
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

        const { text: summary, model } = await llmClient.generateSummary(
          story.title, story.source, story.tags || [], articleText,
        );

        const finalSummary = summary || extractReadableSummary(articleText, story.title);

        await adminUpsertStory(story.slug, {
          content: articleText,
          summary: finalSummary || story.summary,
          ai_summary: !!summary,
          ai_model: summary ? model : null,
          ai_version: 1,
          needs_reprocess: false,
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

// GET /api/scrape/runs  — last N feed run logs
router.get('/runs', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '20'), 10), 100);
    const result = await adminGetFeedRuns(limit);
    if (!result.success) return res.status(500).json(result);
    return res.json({ success: true, data: result.data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

export default router;
