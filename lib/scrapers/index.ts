
import { RedditScraper } from './reddit';
import { TwitterScraper } from './twitter';
import { RssScraper } from './rss';
import { HackerNewsScraper } from './hackernews';
import { NewsStory } from '@/types';
import { adminUpsertStory } from '@/lib/firebase/firestore-admin';
import { geminiClient } from '@/lib/ai/gemini';
import { fetchArticleText as sharedFetchArticleText, extractReadableSummary } from './article-extractor';

interface ScraperConfig {
  reddit?: {
    clientId?: string;
    clientSecret?: string;
  };
  twitter?: {
    apiKey?: string;
    apiSecret?: string;
  };
  rss?: {
    feeds?: string[];
  };
}

export class NewsStoryScraper {
  private redditScraper: RedditScraper;
  private twitterScraper: TwitterScraper;
  private rssScraper: RssScraper;
  private hnScraper: HackerNewsScraper;

  constructor(config: ScraperConfig = {}) {
    this.redditScraper = new RedditScraper(config.reddit?.clientId, config.reddit?.clientSecret);
    this.twitterScraper = new TwitterScraper(config.twitter?.apiKey, config.twitter?.apiSecret);
    this.rssScraper = new RssScraper(config.rss?.feeds);
    this.hnScraper = new HackerNewsScraper();
  }

  async scrapeReddit(limit: number = 10): Promise<NewsStory[]> {
    const stories: NewsStory[] = [];
    const subreddits = this.redditScraper.getFunnyNewsSubreddits();
    
    console.log(`Scraping Reddit from ${subreddits.length} subreddits...`);
    
    for (const subreddit of subreddits.slice(0, 5)) { // Limit to first 5 subreddits
      try {
        const subredditStories = await this.redditScraper.getHotStories(subreddit, Math.ceil(limit / 5));
        stories.push(...subredditStories);
        
        // Small delay to be respectful to Reddit's API
        await this.delay(500);
      } catch (error) {
        console.error(`Failed to scrape r/${subreddit}:`, error);
        continue;
      }
    }
    
    console.log(`Scraped ${stories.length} stories from Reddit`);
    return stories.slice(0, limit);
  }

  async scrapeTwitter(limit: number = 10): Promise<NewsStory[]> {
    const stories: NewsStory[] = [];
    
    try {
      const hashtags = this.twitterScraper.getTrendingHashtags();
      for (const hashtag of hashtags) {
        const hashtagStories = await this.twitterScraper.searchByHashtag(hashtag, limit);
        stories.push(...hashtagStories);
      }
    } catch (error) {
      console.error('Twitter scraping failed:', error);
    }
    
    console.log(`Scraped ${stories.length} stories from Twitter`);
    return stories;
  }

  async scrapeRSS(limit: number = 60): Promise<NewsStory[]> {
    console.log('Scraping RSS feeds...');
    // We have ~30 feeds; use at least 3 stories per feed so we get good coverage.
    // Then cap the total at `limit` after deduplication.
    const perFeed = Math.max(3, Math.ceil(limit / this.rssScraper.getFeedUrls().length));
    const stories = await this.rssScraper.parseAllFeeds(perFeed);
    console.log(`Scraped ${stories.length} stories from RSS feeds`);
    return stories.slice(0, limit);
  }

  async scrapeHackerNews(limit: number = 10): Promise<NewsStory[]> {
    console.log('Scraping Hacker News...');
    try {
      const stories = await this.hnScraper.scrape(limit);
      console.log(`Scraped ${stories.length} stories from Hacker News`);
      return stories;
    } catch (error) {
      console.error('Hacker News scraping failed:', error);
      return [];
    }
  }

  async enhanceNewsStoryWithAI(story: NewsStory): Promise<NewsStory> {
    try {
      console.log(`Enhancing story with AI: ${story.title}`);

      // Fetch actual article text to give Gemini real content to work with
      const articleText = await sharedFetchArticleText(story.url);
      const contentForAI = articleText || story.summary || story.content || '';

      const [enhancedSummary, aiTags, aiFunnyScore] = await Promise.all([
        geminiClient.generateNewsStoryAnalysis(
          story.title,
          story.source,
          story.tags || [],
          contentForAI,
        ),
        geminiClient.categorizeNewsStory(
          story.title,
          story.source,
          contentForAI || undefined
        ),
        geminiClient.calculateFunnyScore(
          story.title,
          story.source,
          contentForAI || undefined,
          story.tags || []
        )
      ]);

      // Merge AI-generated tags with existing tags
      const combinedTags = [...new Set([
        ...(story.tags || []),
        ...(aiTags || [])
      ])].slice(0, 8);

      // Fallback: extract readable sentences from article text
      const fallbackSummary = contentForAI
        ? extractReadableSummary(contentForAI, story.title)
        : story.summary;

      return {
        ...story,
        summary: enhancedSummary || fallbackSummary || story.summary,
        content: contentForAI || story.content || null,
        tags: combinedTags,
        funny_score: Math.round((aiFunnyScore + (story.funny_score || 50)) / 2),
        metadata: {
          ...story.metadata,
          ai_enhanced: true,
          ai_funny_score: aiFunnyScore,
          ai_tags: aiTags,
          enhanced_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('AI enhancement failed for story:', story.title, error);
      return story;
    }
  }

  // Relationships are computed on-the-fly in the graph API from Firestore data
  async generateStoryRelationships(_stories: NewsStory[]): Promise<void> {}
  
  private calculateStoryRelationship(story1: NewsStory, story2: NewsStory): {
    type: 'similar' | 'follow_up' | 'related';
    strength: number;
  } {
    let strength = 0;
    let type: 'similar' | 'follow_up' | 'related' = 'related';
    
    // Check shared tags
    const sharedTags = (story1.tags || []).filter(tag => 
      (story2.tags || []).includes(tag)
    );
    strength += sharedTags.length * 0.2;
    
    // Check similar sources
    if (story1.source === story2.source) {
      strength += 0.3;
    }
    
    // Check title similarity (simple word matching)
    const words1 = story1.title.toLowerCase().split(/\s+/);
    const words2 = story2.title.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => 
      word.length > 3 && words2.includes(word)
    );
    strength += commonWords.length * 0.1;
    
    // Determine relationship type
    if (strength > 0.7) {
      type = 'similar';
    } else if (story1.source === story2.source && strength > 0.4) {
      type = 'follow_up';
    }
    
    return { type, strength: Math.min(strength, 1.0) };
  }

  async scrapeAll(maxPerSource: number = 15): Promise<{ success: number; failed: number; total: number }> {
    console.log('Starting comprehensive news scraping...', { maxPerSource });
    const results = { success: 0, failed: 0, total: 0 };

    // RSS gets a higher budget since we have ~30 feeds — 4 per feed → ~120 stories cap
    const rssLimit = Math.max(60, maxPerSource * 4);

    const [redditStories, rssStories, twitterStories, hnStories] = await Promise.all([
      this.scrapeReddit(maxPerSource).catch(() => [] as NewsStory[]),
      this.scrapeRSS(rssLimit).catch(() => [] as NewsStory[]),
      this.scrapeTwitter(maxPerSource).catch(() => [] as NewsStory[]),
      this.scrapeHackerNews(maxPerSource).catch(() => [] as NewsStory[]),
    ]);

    const allStories: NewsStory[] = [...redditStories, ...rssStories, ...twitterStories, ...hnStories];
    console.log(`Collected ${allStories.length} stories (reddit:${redditStories.length} rss:${rssStories.length} hn:${hnStories.length})`);

    const uniqueStories = this.removeDuplicates(allStories);
    results.total = uniqueStories.length;

    const batchSize = 5;
    for (let i = 0; i < uniqueStories.length; i += batchSize) {
      const batch = uniqueStories.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(async (story) => {
        try {
          const [enhanced, ogImage] = await Promise.all([
            this.enhanceNewsStoryWithAI(story),
            story.image_url ? Promise.resolve(null) : this.fetchOgImage(story.url),
          ]);
          const finalStory = { ...enhanced, image_url: enhanced.image_url || ogImage || null };
          const docId = this.urlToSlug(story.url, story.title || 'untitled');
          const saved = await adminUpsertStory(docId, finalStory);
          if (saved.success) { results.success++; } else { results.failed++; }
        } catch {
          results.failed++;
        }
      }));
      if (i + batchSize < uniqueStories.length) await this.delay(250);
    }

    console.log(`Scraping complete: ${results.success} saved, ${results.failed} failed`);
    return results;
  }

  private urlToSlug(url: string, title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60)
      .replace(/-+$/, '');
    let h = 0;
    for (let i = 0; i < url.length; i++) {
      h = Math.imul(31, h) + url.charCodeAt(i) | 0;
    }
    return `${slug}-${Math.abs(h).toString(36).slice(0, 6)}`;
  }

  private async fetchOgImage(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FunnyNewsBot/1.0)' },
        signal: AbortSignal.timeout(4000),
      });
      const html = await res.text();
      const match =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }
  
  private removeDuplicates(stories: NewsStory[]): NewsStory[] {
    const seen = new Set<string>();
    return stories.filter(story => {
      const key = story.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
