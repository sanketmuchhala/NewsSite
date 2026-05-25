import { NewsStory } from '../types';

export class RedditScraper {
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getFunnyNewsSubreddits(): string[] {
    return [
      'nottheonion',
      'NewsOfTheStupid',
      'offbeat',
      'FloridaMan',
      'WTF',
      'todayilearned',
      'funny',
      'facepalm',
      'mildlyinteresting',
      'AbsurdNews',
      'BrandNewSentence',
    ];
  }

  async getHotStories(subreddit: string, limit = 10): Promise<NewsStory[]> {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
      );

      if (!response.ok) throw new Error(`Reddit API error: ${response.status}`);

      const data = await response.json() as { data?: { children?: any[] } };
      if (!data.data?.children) return [];

      return data.data.children
        .filter((post: any) => this.isValidPost(post.data))
        .slice(0, limit)
        .map((post: any) => this.transform(post.data, subreddit));
    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
      return [];
    }
  }

  private isValidPost(p: any): boolean {
    if (p.removed_by_category || p.removed || !p.title) return false;
    if (p.title.length < 20) return false;
    if (p.over_18) return false;
    return true;
  }

  private transform(p: any, subreddit: string): NewsStory {
    let summary = p.selftext || '';
    if (summary.length > 300) summary = summary.slice(0, 297) + '...';

    let url = p.url;
    if (!url || url.includes('reddit.com') || url.startsWith('/r/')) {
      url = `https://www.reddit.com${p.permalink}`;
    }
    if (url.startsWith('/')) url = `https://www.reddit.com${url}`;

    const tags: string[] = [subreddit.toLowerCase()];
    const full = (p.title + ' ' + (p.selftext || '')).toLowerCase();
    if (full.includes('florida')) tags.push('florida-man');
    if (full.includes('politics') || full.includes('government')) tags.push('politics');
    if (full.includes('tech') || full.includes('technology')) tags.push('tech');
    if (full.includes('science') || full.includes('research')) tags.push('science');
    if (full.includes('celebrity') || full.includes('famous')) tags.push('celebrity');
    if (full.includes('bizarre') || full.includes('weird')) tags.push('bizarre');
    if (full.includes('wtf')) tags.push('wtf');

    const subScores: Record<string, number> = {
      nottheonion: 75, NewsOfTheStupid: 80, FloridaMan: 85,
      WTF: 70, AbsurdNews: 80, offbeat: 65, facepalm: 60,
    };
    let funny_score = subScores[subreddit] ?? 50;
    if ((p.upvote_ratio ?? 0.5) > 0.9) funny_score += 10;
    funny_score += Math.min(p.num_comments / 10, 10);
    if (p.total_awards_received > 0) funny_score += Math.min(p.total_awards_received * 2, 15);
    funny_score = Math.max(1, Math.min(100, Math.round(funny_score)));

    const image_url =
      p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ??
      (p.thumbnail && p.thumbnail !== 'self' && p.thumbnail !== 'default'
        ? p.thumbnail
        : null) ??
      null;

    return {
      title: p.title,
      url,
      source: `Reddit - r/${subreddit}`,
      source_type: 'reddit',
      published_at: new Date(p.created_utc * 1000),
      summary: summary || p.title,
      content: p.selftext || null,
      author: p.author,
      funny_score,
      upvotes: p.score || 0,
      view_count: 0,
      tags: tags.slice(0, 5),
      image_url,
      metadata: {
        reddit_id: p.id,
        reddit_permalink: p.permalink,
        num_comments: p.num_comments,
        subreddit,
      },
    };
  }
}
