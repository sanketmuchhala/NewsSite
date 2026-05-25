import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './admin';
import { NewsStory } from '@/types';

function storiesCol() { return getAdminDb().collection('stories'); }
function storyDoc(id: string) { return getAdminDb().collection('stories').doc(id); }

function toNewsStory(id: string, data: FirebaseFirestore.DocumentData): NewsStory {
  return {
    id: parseInt(id, 10) || undefined,
    slug: id,
    title:        data.title       as string,
    url:          data.url         as string,
    source:       data.source      as string,
    source_type:  data.source_type as NewsStory['source_type'],
    summary:      data.summary     as string | null,
    content:      data.content     as string | null,
    author:       data.author      as string | null,
    funny_score:  data.funny_score as number | undefined,
    tags:         (data.tags as string[]) || [],
    upvotes:      data.upvotes     as number | undefined,
    downvotes:    data.downvotes   as number | undefined,
    view_count:   data.view_count  as number | undefined,
    image_url:    data.image_url   as string | null,
    metadata:     data.metadata,
    published_at: data.published_at instanceof Timestamp
      ? data.published_at.toDate().toISOString()
      : (data.published_at as string | null),
    scraped_at: data.scraped_at instanceof Timestamp
      ? data.scraped_at.toDate()
      : undefined,
    created_at: data.created_at instanceof Timestamp
      ? data.created_at.toDate()
      : undefined,
  };
}

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

/** Recursively strip undefined values — Firestore throws on them */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripUndefined) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) out[k] = stripUndefined(v);
  }
  return out as T;
}

export async function adminUpsertStory(
  id: string,
  story: Partial<NewsStory>
): Promise<{ success: boolean; error?: string }> {
  try {
    const clean = stripUndefined(story);
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
    await storyDoc(id).update({ upvotes: FieldValue.increment(delta) });
    return { success: true };
  } catch (error) {
    console.error('Admin incrementVotes error:', error);
    return { success: false, error: 'Failed to update votes' };
  }
}
