/**
 * Relationship Agent — computes story relationships after each scrape run.
 *
 * Purely algorithmic (no extra LLM calls):
 *   score = tagOverlap * 0.4 + wordOverlap * 0.3 + sameSource * 0.3
 *
 * Pairs with score > 0.3 are persisted to `story_relationships` in Firestore.
 * The graph API reads from this collection instead of computing on every request.
 */

import { adminGetStories, adminUpsertRelationship } from '../firebase/firestore-admin';
import { NewsStory } from '../types';

// Minimum similarity score to create a relationship edge
const MIN_STRENGTH = 0.3;

// Content words to ignore in title overlap
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'for', 'and', 'or', 'but',
  'in', 'on', 'at', 'to', 'of', 'by', 'with', 'from', 'this', 'that', 'his',
  'her', 'its', 'says', 'said', 'has', 'have', 'had', 'not', 'be', 'been',
]);

function titleWords(title: string): Set<string> {
  return new Set(
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  );
}

function scoreStories(a: NewsStory, b: NewsStory): number {
  let score = 0;

  // Tag overlap (max 0.4)
  const aTags = new Set((a.tags ?? []).map(t => t.toLowerCase()));
  const bTags = new Set((b.tags ?? []).map(t => t.toLowerCase()));
  const tagUnion = new Set([...aTags, ...bTags]);
  if (tagUnion.size > 0) {
    const tagIntersect = [...aTags].filter(t => bTags.has(t)).length;
    score += (tagIntersect / tagUnion.size) * 0.4;
  }

  // Title word overlap (max 0.3)
  const aWords = titleWords(a.title);
  const bWords = titleWords(b.title);
  const wordUnion = new Set([...aWords, ...bWords]);
  if (wordUnion.size > 0) {
    const wordIntersect = [...aWords].filter(w => bWords.has(w)).length;
    score += (wordIntersect / wordUnion.size) * 0.3;
  }

  // Same source (max 0.3)
  if (a.source === b.source) score += 0.3;

  return Math.min(score, 1.0);
}

function classifyRelationship(score: number, sameSource: boolean): string {
  if (score >= 0.7)  return 'similar';
  if (sameSource && score >= 0.4) return 'follow_up';
  return 'related';
}

export async function runRelationshipAgent(newSlugs: string[]): Promise<{ edges: number; skipped: number }> {
  if (newSlugs.length === 0) return { edges: 0, skipped: 0 };

  console.log(`[RelationshipAgent] Computing relationships for ${newSlugs.length} new stories…`);

  // Load recent stories for comparison (last 150)
  const result = await adminGetStories(150, 'scraped_at');
  if (!result.success || !result.data?.length) return { edges: 0, skipped: 0 };

  const allStories = result.data;
  const newSet = new Set(newSlugs);
  const newStories = allStories.filter(s => newSet.has(s.slug));
  const existingStories = allStories.filter(s => !newSet.has(s.slug));

  let edges = 0;
  let skipped = 0;

  for (const newStory of newStories) {
    for (const existing of existingStories) {
      const strength = scoreStories(newStory, existing);
      if (strength < MIN_STRENGTH) { skipped++; continue; }

      const type = classifyRelationship(strength, newStory.source === existing.source);
      await adminUpsertRelationship(newStory.slug, existing.slug, type, strength);
      edges++;
    }
  }

  console.log(`[RelationshipAgent] Done: ${edges} edges created, ${skipped} pairs skipped`);
  return { edges, skipped };
}
