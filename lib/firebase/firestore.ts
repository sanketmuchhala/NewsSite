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

function toNewsStory(id: string, data: Record<string, unknown>): NewsStory {
  return {
    id: parseInt(id, 10) || undefined,
    title:       data.title      as string,
    url:         data.url        as string,
    source:      data.source     as string,
    source_type: data.source_type as NewsStory['source_type'],
    summary:     data.summary    as string | null,
    content:     data.content    as string | null,
    author:      data.author     as string | null,
    funny_score: data.funny_score as number | undefined,
    tags:        (data.tags as string[]) || [],
    upvotes:     data.upvotes    as number | undefined,
    downvotes:   data.downvotes  as number | undefined,
    view_count:  data.view_count as number | undefined,
    image_url:   data.image_url  as string | null,
    metadata:    data.metadata,
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
  story: Omit<NewsStory, 'id' | 'created_at' | 'updated_at' | 'scraped_at'>
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
