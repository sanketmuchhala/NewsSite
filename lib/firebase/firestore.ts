import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  increment,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  Firestore,
} from 'firebase/firestore';
import { firebaseApp } from './config';
import { NewsStory } from '@/types';

// ─── Client ──────────────────────────────────────────────────

export const db: Firestore = getFirestore(firebaseApp);

// ─── Collection refs ──────────────────────────────────────────

export const storiesRef  = () => collection(db, 'stories');
export const storyRef    = (id: string) => doc(db, 'stories', id);
export const votesRef    = () => collection(db, 'votes');

// ─── Converters ───────────────────────────────────────────────

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

function toNewsStory(id: string, data: Record<string, unknown>): NewsStory {
  const meta = (data.metadata as Record<string, unknown>) ?? {};
  return {
    slug: id,
    title:       (data.title      as string) ?? '',
    url:         (data.url        as string) ?? '',
    source:      (data.source     as string) ?? '',
    source_type: (data.source_type as NewsStory['source_type']) ?? 'rss',
    category:    (data.category   as string) ?? (meta.feed_category as string) ?? 'weird',
    feed_url:    (data.feed_url   as string | null) ?? (meta.feed_url as string | null) ?? null,
    rss_guid:    (data.rss_guid   as string | null) ?? (meta.rss_guid as string | null) ?? null,
    reddit_id:   (data.reddit_id  as string | null) ?? (meta.reddit_id as string | null) ?? null,
    reddit_permalink: (data.reddit_permalink as string | null) ?? (meta.reddit_permalink as string | null) ?? null,
    hn_id:       (data.hn_id      as string | null) ?? (meta.hn_id as string | null) ?? null,
    summary:     (data.summary    as string | null) ?? null,
    content:     (data.content    as string | null) ?? null,
    author:      (data.author     as string | null) ?? null,
    funny_score: (data.funny_score as number) ?? 50,
    quality_score: (data.quality_score as number) ?? 0,
    ai_summary:  (data.ai_summary as boolean) ?? false,
    ai_model:    (data.ai_model   as string | null) ?? null,
    ai_version:  (data.ai_version as number) ?? 0,
    needs_reprocess: (data.needs_reprocess as boolean) ?? false,
    tags:        (data.tags as string[]) ?? [],
    upvotes:     (data.upvotes    as number) ?? 0,
    downvotes:   (data.downvotes  as number) ?? 0,
    view_count:  (data.view_count as number) ?? 0,
    image_url:   (data.image_url  as string | null) ?? null,
    content_status: (data.content_status as NewsStory['content_status']) ?? 'unknown',
    published_at: data.published_at instanceof Timestamp
      ? data.published_at.toDate().toISOString()
      : (data.published_at as string | null) ?? null,
    scraped_at:  toDate(data.scraped_at),
    created_at:  toDate(data.created_at),
    updated_at:  toDate(data.updated_at),
  };
}

// ─── Stories ──────────────────────────────────────────────────

export async function getStories(
  pageSize = 12,
  sortBy: 'scraped_at' | 'created_at' | 'upvotes' | 'funny_score' = 'scraped_at'
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const constraints: QueryConstraint[] = [
      orderBy(sortBy, 'desc'),
      limit(pageSize),
    ];
    const snap = await getDocs(query(storiesRef(), ...constraints));
    const data = snap.docs.map(d => toNewsStory(d.id, d.data()));
    return { success: true, data };
  } catch (error) {
    console.error('Firestore getStories error:', error);
    return { success: false, error: 'Failed to fetch stories' };
  }
}

export async function getStoryById(
  id: string
): Promise<{ success: boolean; data?: NewsStory; error?: string }> {
  try {
    const snap = await getDoc(storyRef(id));
    if (!snap.exists()) return { success: false, error: 'Story not found' };
    return { success: true, data: toNewsStory(snap.id, snap.data()) };
  } catch (error) {
    console.error('Firestore getStoryById error:', error);
    return { success: false, error: 'Failed to fetch story' };
  }
}

export async function createStory(
  story: Omit<NewsStory, 'created_at' | 'updated_at' | 'scraped_at'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ref = await addDoc(storiesRef(), {
      ...story,
      upvotes:    story.upvotes    ?? 0,
      downvotes:  story.downvotes  ?? 0,
      view_count: story.view_count ?? 0,
      funny_score: story.funny_score ?? 50,
      tags:       story.tags       || [],
      created_at: serverTimestamp(),
      scraped_at: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('Firestore createStory error:', error);
    return { success: false, error: 'Failed to create story' };
  }
}

export async function upsertStory(
  id: string,
  story: Partial<NewsStory>
): Promise<{ success: boolean; error?: string }> {
  try {
    await setDoc(storyRef(id), {
      ...story,
      scraped_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Firestore upsertStory error:', error);
    return { success: false, error: 'Failed to upsert story' };
  }
}

export async function incrementStoryVotes(
  id: string,
  delta: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(storyRef(id), { upvotes: increment(delta) });
    return { success: true };
  } catch (error) {
    console.error('Firestore incrementStoryVotes error:', error);
    return { success: false, error: 'Failed to update votes' };
  }
}

export async function incrementViewCount(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDoc(storyRef(id), { view_count: increment(1) });
    return { success: true };
  } catch (error) {
    console.error('Firestore incrementViewCount error:', error);
    return { success: false, error: 'Failed to update view count' };
  }
}

export async function deleteStory(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteDoc(storyRef(id));
    return { success: true };
  } catch (error) {
    console.error('Firestore deleteStory error:', error);
    return { success: false, error: 'Failed to delete story' };
  }
}

// ─── Filtering helpers ────────────────────────────────────────

export async function getStoriesBySource(
  sourceType: string,
  pageSize = 12
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const snap = await getDocs(query(
      storiesRef(),
      where('source_type', '==', sourceType),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    ));
    return { success: true, data: snap.docs.map(d => toNewsStory(d.id, d.data())) };
  } catch (error) {
    console.error('Firestore getStoriesBySource error:', error);
    return { success: false, error: 'Failed to filter stories' };
  }
}

export async function getStoriesByMinScore(
  minScore: number,
  pageSize = 12
): Promise<{ success: boolean; data?: NewsStory[]; error?: string }> {
  try {
    const snap = await getDocs(query(
      storiesRef(),
      where('funny_score', '>=', minScore),
      orderBy('funny_score', 'desc'),
      limit(pageSize)
    ));
    return { success: true, data: snap.docs.map(d => toNewsStory(d.id, d.data())) };
  } catch (error) {
    console.error('Firestore getStoriesByMinScore error:', error);
    return { success: false, error: 'Failed to filter by score' };
  }
}
