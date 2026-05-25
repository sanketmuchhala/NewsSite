import { NextRequest, NextResponse } from 'next/server';
import { adminGetStoryById, adminUpsertStory } from '@/lib/firebase/firestore-admin';
import { geminiClient } from '@/lib/ai/gemini';
import { fetchArticleText, extractReadableSummary } from '@/lib/scrapers/article-extractor';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyResult = await adminGetStoryById(params.id);
    if (!storyResult.success || !storyResult.data) {
      return NextResponse.json({ success: false, error: 'Story not found' }, { status: 404 });
    }
    const story = storyResult.data;

    // Already has real content — return it
    if (story.content && story.content.length > 100 && story.content !== story.title) {
      return NextResponse.json({ success: true, content: story.content, summary: story.summary, cached: true });
    }

    const articleText = await fetchArticleText(story.url);
    if (!articleText) {
      return NextResponse.json({ success: false, error: 'Could not fetch article' });
    }

    // Try Gemini, fall back to extracted text
    let summary: string | null = null;
    try {
      summary = await geminiClient.generateNewsStoryAnalysis(
        story.title, story.source, story.tags || [], articleText,
      );
    } catch { /* quota — use fallback */ }

    if (!summary) {
      summary = extractReadableSummary(articleText, story.title);
    }

    // Cache to Firestore
    await adminUpsertStory(params.id, {
      content: articleText,
      summary: summary || story.summary,
      ai_summary: !!summary,
      ai_model: summary ? 'gemini-2.0-flash' : null,
      ai_version: 1,
      needs_reprocess: false,
    });

    return NextResponse.json({ success: true, content: articleText, summary, cached: false });
  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch content' }, { status: 500 });
  }
}
