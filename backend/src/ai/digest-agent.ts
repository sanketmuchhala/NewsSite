/**
 * Digest Agent — runs daily at 8 AM.
 *
 * Picks the top 8 stories by funny_score from the last 48 hours,
 * asks the LLM to write a punchy 3-sentence roundup, and saves the
 * result to Firestore at digests/YYYY-MM-DD.
 */

import { adminGetStories, adminSetDigest } from '../firebase/firestore-admin';
import { llmClient } from './llm';

export async function runDigestAgent(): Promise<{ success: boolean; date?: string; error?: string }> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  console.log(`[DigestAgent] Generating digest for ${date}…`);

  try {
    // Pick stories from the last 48h sorted by funny_score
    const result = await adminGetStories(200, 'funny_score');
    if (!result.success || !result.data?.length) {
      return { success: false, error: 'No stories available' };
    }

    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recent = result.data
      .filter(s => {
        const t = s.published_at ? new Date(s.published_at).getTime() : 0;
        return t > cutoff;
      })
      .slice(0, 8);

    // Fall back to top 8 overall if nothing from last 48h
    const top = recent.length >= 3 ? recent : result.data.slice(0, 8);
    if (top.length === 0) return { success: false, error: 'No stories to digest' };

    const storyList = top
      .map((s, i) => `${i + 1}. "${s.title}" (${s.source}) — ${s.summary?.slice(0, 150) ?? ''}`)
      .join('\n');

    const prompt = `You are the editor of a deadpan absurdist news digest. Write exactly 3 punchy sentences that summarize today's most ridiculous stories. Be dry and witty, not silly. Treat the absurdity as completely normal.

Today's top stories:
${storyList}

Write the 3-sentence digest now (no intro, no title, just the prose):`;

    const { text: content, model } = await llmClient.generateSummary(
      'Daily Digest', 'FunnyNews', [], prompt,
    );

    if (!content) return { success: false, error: 'LLM returned empty content' };

    // Extract a headline from the first sentence
    const headline = content.split(/[.!?]/)[0]?.trim() ?? `Today's Absurd News Digest`;

    await adminSetDigest(date, {
      date,
      headline,
      content,
      story_slugs: top.map(s => s.slug),
      top_tags: [...new Set(top.flatMap(s => s.tags ?? []))].slice(0, 8),
      model,
      generated_at: null,
    });

    console.log(`[DigestAgent] Digest saved for ${date}`);
    return { success: true, date };

  } catch (err: any) {
    console.error('[DigestAgent] Error:', err);
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}
