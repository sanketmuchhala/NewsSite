import { NextRequest, NextResponse } from 'next/server';
import { adminGetStories, adminUpsertStory } from '@/lib/firebase/firestore-admin';
import { geminiClient } from '@/lib/ai/gemini';
import { fetchArticleText, extractReadableSummary } from '@/lib/scrapers/article-extractor';

// POST /api/scrape/enhance
// Re-fetches article text for stories where summary == title or content is missing.
export async function POST(request: NextRequest) {
  const { limit = 20, force = false } = await request.json().catch(() => ({}));

  const result = await adminGetStories(limit as number, 'scraped_at');
  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, error: 'Failed to fetch stories' }, { status: 500 });
  }

  const needsEnhancement = force
    ? result.data
    : result.data.filter(
        s => !s.content || s.content.length < 100 || s.summary === s.title || (s.summary?.length ?? 0) < 80
      );

  const stats = { updated: 0, failed: 0, skipped: result.data.length - needsEnhancement.length };

  for (const story of needsEnhancement) {
    try {
      const articleText = await fetchArticleText(story.url);
      if (!articleText) { stats.failed++; continue; }

      let summary: string | null = null;
      try {
        summary = await geminiClient.generateNewsStoryAnalysis(
          story.title, story.source, story.tags || [], articleText,
        );
      } catch { /* Gemini quota - use fallback */ }

      if (!summary) {
        summary = extractReadableSummary(articleText, story.title);
      }

      await adminUpsertStory(story.slug, {
        content: articleText,
        summary: summary || story.summary,
        ai_summary: !!summary,
        ai_model: summary ? 'gemini-2.0-flash' : null,
        ai_version: 1,
        needs_reprocess: false,
      });
      stats.updated++;

      await new Promise(r => setTimeout(r, 300));
    } catch {
      stats.failed++;
    }
  }

  return NextResponse.json({ success: true, stats });
}
