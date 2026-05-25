import { Router, Request, Response } from 'express';
import {
  adminGetStories,
  adminGetStoriesBySource,
  adminGetStoryById,
  adminIncrementVotes,
  adminIncrementViewCount,
  adminUpsertStory,
} from '../firebase/firestore-admin';
import { geminiClient } from '../ai/gemini';
import { fetchArticleText, extractReadableSummary } from '../scrapers/article-extractor';

const router = Router();

// GET /api/stories
router.get('/', async (req: Request, res: Response) => {
  const pageSize = Math.min(500, parseInt((req.query.pageSize as string) || '100'));
  const source = req.query.source as string | undefined;
  const sortByParam = ((req.query.sortBy || req.query.sort) as string) || 'scraped_at';
  const sortBy = (['scraped_at', 'upvotes', 'funny_score'] as const).includes(
    sortByParam as any,
  )
    ? (sortByParam as 'scraped_at' | 'upvotes' | 'funny_score')
    : 'scraped_at';

  const result =
    source && source !== 'all'
      ? await adminGetStoriesBySource(source, pageSize)
      : await adminGetStories(pageSize, sortBy);

  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error });
  }

  return res.json({
    success: true,
    data: result.data,
    pagination: {
      page: 1,
      pageSize,
      total: result.data?.length ?? 0,
      hasMore: (result.data?.length ?? 0) === pageSize,
    },
  });
});

// POST /api/stories
router.post('/', async (req: Request, res: Response) => {
  try {
    const story = req.body;
    const id = Date.now().toString(36);
    const result = await adminUpsertStory(id, story);
    if (result.success) {
      return res.status(201).json({ success: true, data: { id } });
    }
    return res.status(500).json({ success: false, error: result.error });
  } catch (error) {
    console.error('Create story error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/stories/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await adminGetStoryById(req.params.id);
  if (!result.success || !result.data) {
    return res.status(404).json({ success: false, error: 'Story not found' });
  }
  // Increment view count (fire and forget)
  adminIncrementViewCount(req.params.id).catch(() => {});
  return res.json({ success: true, data: result.data });
});

// GET /api/stories/:id/content  — fetch/cache article content
router.get('/:id/content', async (req: Request, res: Response) => {
  try {
    const storyResult = await adminGetStoryById(req.params.id);
    if (!storyResult.success || !storyResult.data) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }
    const story = storyResult.data;

    // Already cached
    if (story.content && story.content.length > 100 && story.content !== story.title) {
      return res.json({ success: true, content: story.content, summary: story.summary, cached: true });
    }

    const articleText = await fetchArticleText(story.url);
    if (!articleText) {
      return res.json({ success: false, error: 'Could not fetch article' });
    }

    let summary: string | null = null;
    try {
      summary = await geminiClient.generateNewsStoryAnalysis(
        story.title, story.source, story.tags || [], articleText,
      );
    } catch { /* quota — use fallback */ }

    if (!summary) summary = extractReadableSummary(articleText, story.title);

    await adminUpsertStory(req.params.id, {
      content: articleText,
      summary: summary || story.summary,
      ai_summary: !!summary,
      ai_model: summary ? 'gemini-2.0-flash' : null,
      ai_version: 1,
      needs_reprocess: false,
    });

    return res.json({ success: true, content: articleText, summary, cached: false });
  } catch (error) {
    console.error('Content fetch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

// POST /api/stories/:id/vote
router.post('/:id/vote', async (req: Request, res: Response) => {
  try {
    const { vote_type } = req.body;
    if (!['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({ success: false, error: 'Invalid vote type' });
    }
    const delta = vote_type === 'upvote' ? 1 : -1;
    const result = await adminIncrementVotes(req.params.id, delta);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    return res.json({ success: true, data: { vote_type } });
  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
