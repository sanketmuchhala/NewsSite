import type { Analytics } from 'firebase/analytics';

let analyticsInstance: Analytics | null = null;

async function getAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    const { getAnalytics: _getAnalytics, isSupported } = await import('firebase/analytics');
    const { firebaseApp } = await import('./config');
    if (!(await isSupported())) return null;
    analyticsInstance = _getAnalytics(firebaseApp);
    return analyticsInstance;
  } catch {
    return null;
  }
}

export async function trackStoryView(storyId: string, title: string) {
  const a = await getAnalytics();
  if (!a) return;
  const { logEvent } = await import('firebase/analytics');
  logEvent(a, 'story_view', { story_id: storyId, story_title: title.slice(0, 100) });
}

export async function trackStoryVote(storyId: string, delta: number) {
  const a = await getAnalytics();
  if (!a) return;
  const { logEvent } = await import('firebase/analytics');
  logEvent(a, 'story_vote', { story_id: storyId, delta });
}

export async function trackCategoryFilter(category: string) {
  const a = await getAnalytics();
  if (!a) return;
  const { logEvent } = await import('firebase/analytics');
  logEvent(a, 'category_filter', { category });
}

export async function trackSearchQuery(query: string) {
  const a = await getAnalytics();
  if (!a) return;
  const { logEvent } = await import('firebase/analytics');
  logEvent(a, 'search_query', { query: query.slice(0, 100) });
}
