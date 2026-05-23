import { NewsStory } from '@/types';

export class HackerNewsScraper {
  private searchQueries = ['funny', 'weird', 'bizarre', 'crazy', 'joke', 'satire', 'florida man'];

  async scrape(limit: number = 10): Promise<NewsStory[]> {
    const stories: NewsStory[] = [];
    console.log(`Scraping Hacker News...`);

    for (const query of this.searchQueries) {
      if (stories.length >= limit) break;
      
      try {
        const response = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>50`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          }
        );

        if (!response.ok) {
          console.warn(`Hacker News API error for query "${query}": ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.hits && Array.isArray(data.hits)) {
          const validHits = data.hits
            .filter((hit: any) => hit.title && hit.url && !stories.some(s => s.url === hit.url))
            .slice(0, Math.ceil(limit / this.searchQueries.length));
            
          for (const hit of validHits) {
            stories.push(this.transformToNewsStory(hit, query));
          }
        }
      } catch (error) {
        console.error(`Error fetching HN stories for query "${query}":`, error);
      }
    }

    return stories.slice(0, limit);
  }

  private transformToNewsStory(hit: any, query: string): NewsStory {
    const tags = ['tech', 'hackernews', query.replace(' ', '-')];
    
    // Attempt to extract some content/summary
    let summary = hit.story_text || hit.title;
    if (summary.length > 300) {
      summary = summary.substring(0, 297) + '...';
    }

    return {
      title: hit.title,
      url: hit.url,
      source: 'Hacker News',
      source_type: 'api' as const, // Using api for HN
      published_at: new Date(hit.created_at),
      summary: summary,
      author: hit.author,
      funny_score: 50 + (hit.points > 100 ? 15 : 5), // Base score + bonus for upvotes
      upvotes: hit.points || 0,
      view_count: 0,
      tags: tags,
      metadata: {
        hn_id: hit.objectID,
        comments: hit.num_comments
      }
    };
  }
}
