import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './admin';
import { NewsStory, FeedRun, Digest, ContentStatus, SourceType } from '../types';

function storiesCol() { return getAdminDb().collection('stories'); }
function storyDoc(id: string) { return getAdminDb().collection('stories').doc(id); }
function feedRunsCol() { return getAdminDb().collection('feed_runs'); }
function relationshipsCol() { return getAdminDb().collection('story_relationships'); }
function digestsCol() { return getAdminDb().collection('digests'); }

// ── Timestamp helper ─────────────────────────────────────────────────────────
function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

// ── Document → NewsStory (backward-compat: reads flat fields + legacy metadata blob) ──
function toNewsStory(id: string, d: FirebaseFirestore.DocumentData): NewsStory {
  const meta = (d.metadata as Record<string, unknown>) ?? {};

  return {
    slug: id,

    url:          (d.url          as string)  ?? '',
    title:        (d.title        as string)  ?? '',
    summary:      (d.summary      as string | null) ?? null,
    content:      (d.content      as string | null) ?? null,
    author:       (d.author       as string | null) ?? null,
    image_url:    (d.image_url    as string | null) ?? null,

    source:       (d.source       as string)  ?? '',
    source_type:  (d.source_type  as SourceType) ?? 'rss',
    category:     (d.category     as string)  ?? (meta.feed_category as string) ?? 'weird',
    feed_url:     (d.feed_url     as string | null) ?? (meta.feed_url as string | null) ?? null,
    rss_guid:     (d.rss_guid     as string | null) ?? (meta.rss_guid as string | null) ?? null,
    reddit_id:    (d.reddit_id    as string | null) ?? (meta.reddit_id as string | null) ?? null,
    reddit_permalink: (d.reddit_permalink as string | null) ?? (meta.reddit_permalink as string | null) ?? null,
    hn_id:        (d.hn_id        as string | null) ?? (meta.hn_id as string | null) ?? null,

    tags:         (d.tags as string[]) ?? [],
    funny_score:  (d.funny_score  as number)  ?? 50,
    quality_score:(d.quality_score as number) ?? 0,
    ai_summary:   (d.ai_summary   as boolean) ?? !!(meta.ai_enhanced),
    ai_model:     (d.ai_model     as string | null) ?? null,
    ai_version:   (d.ai_version   as number)  ?? 0,
    needs_reprocess: (d.needs_reprocess as boolean) ?? false,

    upvotes:      (d.upvotes      as number)  ?? 0,
    downvotes:    (d.downvotes    as number)  ?? 0,
    view_count:   (d.view_count   as number)  ?? 0,

    content_status: (d.content_status as ContentStatus) ?? 'unknown',

    published_at: d.published_at instanceof Timestamp
      ? d.published_at.toDate().toISOString()
      : (d.published_at as string | null) ?? null,
    scraped_at:  toDate(d.scraped_at),
    created_at:  toDate(d.created_at),
    updated_at:  toDate(d.updated_at),
  };
}

/** Recursively strip undefined values — Firestore throws on them */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(stripUndefined) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = stripUndefined(v);
  }
  return out as T;
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export async function adminGetStories(
  pageSize = 100,
  sortBy: 'scraped_at' | 'upvotes' | 'funny_score' = 'scraped_at'
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const snap = await storiesCol().orderBy(sortBy, 'desc').limit(pageSize).get();
    return { success: true, data: snap.docs.map(d => toNewsStory(d.id, d.data())) };
  } catch (error) {
    console.error('Admin getStories error:', error);
    return { success: false, error: 'Failed to fetch stories' };
  }
}

export async function adminGetStoryById(
  id: string
): Promise<{ success: boolean; data?: NewsStory; error?: string }> {
  try {
    const snap = await storyDoc(id).get();
    if (!snap.exists) return { success: false, error: 'Story not found' };
    return { success: true, data: toNewsStory(snap.id, snap.data()!) };
  } catch (error) {
    console.error('Admin getStoryById error:', error);
    return { success: false, error: 'Failed to fetch story' };
  }
}

export async function adminGetStoriesBySource(
  sourceType: string,
  pageSize = 20
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const snap = await storiesCol()
      .where('source_type', '==', sourceType)
      .orderBy('scraped_at', 'desc')
      .limit(pageSize)
      .get();
    return { success: true, data: snap.docs.map(d => toNewsStory(d.id, d.data())) };
  } catch (error) {
    console.error('Admin getStoriesBySource error:', error);
    return { success: false, error: 'Failed to filter stories' };
  }
}

export async function adminGetStoriesByCategory(
  category: string,
  pageSize = 20
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const snap = await storiesCol()
      .where('category', '==', category)
      .orderBy('scraped_at', 'desc')
      .limit(pageSize)
      .get();
    return { success: true, data: snap.docs.map(d => toNewsStory(d.id, d.data())) };
  } catch (error) {
    console.error('Admin getStoriesByCategory error:', error);
    return { success: false, error: 'Failed to filter by category' };
  }
}

export async function adminGetStoriesNeedingReprocess(
  limit = 50
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const snap = await storiesCol()
      .where('needs_reprocess', '==', true)
      .orderBy('scraped_at', 'desc')
      .limit(limit)
      .get();
    return { success: true, data: snap.docs.map(d => toNewsStory(d.id, d.data())) };
  } catch (error) {
    console.error('Admin getStoriesNeedingReprocess error:', error);
    return { success: false, error: 'Failed to fetch reprocess queue' };
  }
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export async function adminUpsertStory(
  id: string,
  story: Partial<NewsStory>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Never persist the slug as a field — it IS the doc ID
    const { slug: _slug, ...rest } = story as NewsStory & { slug?: string };
    const clean = stripUndefined(rest);
    await storyDoc(id).set(
      { ...clean, scraped_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Admin upsertStory error:', error);
    return { success: false, error: 'Failed to upsert story' };
  }
}

export async function adminIncrementViewCount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await storyDoc(id).update({ view_count: FieldValue.increment(1) });
    return { success: true };
  } catch (error) {
    console.error('Admin incrementViewCount error:', error);
    return { success: false, error: 'Failed to update view count' };
  }
}

export async function adminIncrementVotes(
  id: string,
  delta: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const field = delta > 0 ? 'upvotes' : 'downvotes';
    await storyDoc(id).update({ [field]: FieldValue.increment(Math.abs(delta)) });
    return { success: true };
  } catch (error) {
    console.error('Admin incrementVotes error:', error);
    return { success: false, error: 'Failed to update votes' };
  }
}

// ── FeedRun helpers ───────────────────────────────────────────────────────────

export async function adminCreateFeedRun(): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ref = await feedRunsCol().add({
      started_at: FieldValue.serverTimestamp(),
      finished_at: null,
      status: 'running',
      sources_tried: 0,
      stories_found: 0,
      stories_saved: 0,
      stories_failed: 0,
      ai_enhanced: 0,
      errors: [],
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('Admin createFeedRun error:', error);
    return { success: false, error: 'Failed to create feed run' };
  }
}

export async function adminFinishFeedRun(
  id: string,
  stats: Partial<FeedRun>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: _id, started_at: _sa, ...rest } = stats as FeedRun;
    await feedRunsCol().doc(id).update({
      ...stripUndefined(rest),
      finished_at: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Admin finishFeedRun error:', error);
    return { success: false, error: 'Failed to finish feed run' };
  }
}

// ── Story Relationships ───────────────────────────────────────────────────────

export async function adminUpsertRelationship(
  sourceId: string,
  targetId: string,
  relationshipType: string,
  strength: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Deterministic doc ID so we don't create duplicates on re-runs
    const docId = [sourceId, targetId].sort().join('__');
    await relationshipsCol().doc(docId).set(
      { source_id: sourceId, target_id: targetId, relationship_type: relationshipType, strength, created_at: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Admin upsertRelationship error:', error);
    return { success: false, error: 'Failed to upsert relationship' };
  }
}

export async function adminGetRelationships(
  limit = 500
): Promise<{ success: boolean; data?: { source_id: string; target_id: string; relationship_type: string; strength: number }[]; error?: string }> {
  try {
    const snap = await relationshipsCol().orderBy('strength', 'desc').limit(limit).get();
    const data = snap.docs.map(d => {
      const r = d.data();
      return {
        source_id:         r.source_id         as string,
        target_id:         r.target_id         as string,
        relationship_type: r.relationship_type as string,
        strength:          r.strength          as number,
      };
    });
    return { success: true, data };
  } catch (error) {
    console.error('Admin getRelationships error:', error);
    return { success: false, error: 'Failed to fetch relationships' };
  }
}

export async function adminGetFeedRuns(
  limit = 20
): Promise<{ success: boolean; data?: (FeedRun & { id: string })[]; error?: string }> {
  try {
    const snap = await feedRunsCol().orderBy('started_at', 'desc').limit(limit).get();
    const data = snap.docs.map(d => {
      const raw = d.data();
      return {
        id: d.id,
        started_at:    toDate(raw.started_at),
        finished_at:   toDate(raw.finished_at),
        status:        (raw.status as FeedRun['status']) ?? 'done',
        sources_tried: (raw.sources_tried as number) ?? 0,
        stories_found: (raw.stories_found as number) ?? 0,
        stories_saved: (raw.stories_saved as number) ?? 0,
        stories_failed:(raw.stories_failed as number) ?? 0,
        ai_enhanced:   (raw.ai_enhanced as number) ?? 0,
        errors:        (raw.errors as string[]) ?? [],
      };
    });
    return { success: true, data };
  } catch (error) {
    console.error('Admin getFeedRuns error:', error);
    return { success: false, error: 'Failed to fetch feed runs' };
  }
}

// ── Digest helpers ────────────────────────────────────────────────────────────

export async function adminSetDigest(
  date: string,
  digest: Digest,
): Promise<{ success: boolean; error?: string }> {
  try {
    await digestsCol().doc(date).set(
      { ...digest, generated_at: FieldValue.serverTimestamp() },
      { merge: false }
    );
    return { success: true };
  } catch (error) {
    console.error('Admin setDigest error:', error);
    return { success: false, error: 'Failed to save digest' };
  }
}

export async function adminGetLatestDigest(): Promise<{ success: boolean; data?: Digest & { date: string }; error?: string }> {
  try {
    const snap = await digestsCol().orderBy('date', 'desc').limit(1).get();
    if (snap.empty) return { success: false, error: 'No digest found' };
    const d = snap.docs[0].data();
    return {
      success: true,
      data: {
        date:         snap.docs[0].id,
        headline:     d.headline    as string,
        content:      d.content     as string,
        story_slugs:  (d.story_slugs  as string[]) ?? [],
        top_tags:     (d.top_tags     as string[]) ?? [],
        model:        d.model       as string,
        generated_at: toDate(d.generated_at),
      },
    };
  } catch (error) {
    console.error('Admin getLatestDigest error:', error);
    return { success: false, error: 'Failed to fetch digest' };
  }
}
