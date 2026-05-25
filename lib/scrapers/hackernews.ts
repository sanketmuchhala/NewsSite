import { NewsStory } from '@/types';

// Queries grouped by intent — we rotate through them to get variety
const QUERY_GROUPS = {
  weird:   ['weird', 'bizarre', 'absurd', 'ridiculous', 'florida man', 'man arrested', 'woman arrested'],
  funny:   ['funny', 'hilarious', 'joke', 'satire', 'comedy', 'accidentally'],
  tech:    ['AI fails', 'startup fails', 'bug causes', 'outage', 'data breach', 'scam', 'exploit'],
  science: ['scientists discover', 'study finds', 'researchers find', 'unexpected discovery'],
};

const ALL_QUERIES = Object.values(QUERY_GROUPS).flat();

export class HackerNewsScraper {
  async scrape(limit = 15): Promise<NewsStory[]> {
    console.log('Scraping Hacker News…');
    const seenUrls = new Set<string>();
    const stories: NewsStory[] = [];

    // Round-robin across groups for variety
    const queries = [...ALL_QUERIES];

    for (const query of queries) {
      if (stories.length >= limit) break;
      try {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>30&hitsPerPage=8`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FunnyNewsBot/1.0)' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;

        const data = await res.json();
        const hits: any[] = data.hits ?? [];

        for (const hit of hits) {
          if (!hit.title || !hit.url) continue;
          if (seenUrls.has(hit.url)) continue;
          seenUrls.add(hit.url);
          stories.push(this.transform(hit, query));
          if (stories.length >= limit) break;
        }
      } catch {
        // silently skip failed queries
      }
    }

    // Also grab HN's front page "top stories" for general interesting content
    try {
      const top = await this.scrapeTopStories(Math.min(5, limit - stories.length), seenUrls);
      stories.push(...top);
    } catch { /* optional */ }

    console.log(`HN: ${stories.length} stories`);
    return stories.slice(0, limit);
  }

  private async scrapeTopStories(limit: number, seenUrls: Set<string>): Promise<NewsStory[]> {
    if (limit <= 0) return [];
    const res = await fetch(
      'https://hn.algolia.com/api/v1/search?tags=front_page&numericFilters=points>100&hitsPerPage=10',
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits ?? [])
      .filter((h: any) => h.title && h.url && !seenUrls.has(h.url))
      .slice(0, limit)
      .map((h: any) => { seenUrls.add(h.url); return this.transform(h, 'front_page'); });
  }

  private transform(hit: any, query: string): NewsStory {
    // Determine category from query group
    let category = 'tech';
    for (const [cat, queries] of Object.entries(QUERY_GROUPS)) {
      if (queries.includes(query)) { category = cat; break; }
    }

    const tags = ['hackernews', category];
    const title = hit.title as string;
    const titleLower = title.toLowerCase();

    // Add more specific tags
    if (/weed|cannabis|marijuana|420|stoner/i.test(titleLower)) tags.push('weed', '420');
    if (/florida/i.test(titleLower)) tags.push('florida-man');
    if (/ai|openai|chatgpt|llm/i.test(titleLower)) tags.push('ai');
    if (/startup|ipo|funding/i.test(titleLower)) tags.push('startup');
    if (/arrest|crime|theft|hack/i.test(titleLower)) tags.push('crime');

    // Funny score: base from points + bonuses
    const pts = hit.points ?? 0;
    let funny_score = 45 + Math.min(20, Math.floor(pts / 100) * 5);
    if (category === 'weird' || category === 'funny') funny_score += 15;
    if (/weird|bizarre|absurd|funny|ridiculous/i.test(titleLower)) funny_score += 10;
    funny_score = Math.min(95, funny_score);

    const summary = hit.story_text
      ? hit.story_text.replace(/<[^>]*>/g, '').trim().slice(0, 300)
      : title;

    return {
      slug: '',   // filled in by scrapeAll via urlToSlug
      title,
      url: hit.url,
      source: 'Hacker News',
      source_type: 'hackernews' as const,
      category,
      feed_url: null,
      rss_guid: null,
      reddit_id: null,
      reddit_permalink: null,
      hn_id: (hit.objectID as string) || null,
      published_at: new Date(hit.created_at),
      summary,
      content: null,
      author: (hit.author as string) || null,
      funny_score,
      quality_score: 0,
      ai_summary: false,
      ai_model: null,
      ai_version: 0,
      needs_reprocess: false,
      upvotes: pts,
      downvotes: 0,
      view_count: 0,
      content_status: 'unknown' as const,
      tags: [...new Set(tags)],
      image_url: null,
      scraped_at: null,
      created_at: null,
      updated_at: null,
    };
  }
}
