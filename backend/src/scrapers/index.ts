import { RedditScraper } from './reddit';
import { TwitterScraper } from './twitter';
import { RssScraper } from './rss';
import { HackerNewsScraper } from './hackernews';
import { NewsStory } from '../types';
import { adminUpsertStory } from '../firebase/firestore-admin';
import { llmClient } from '../ai/llm';
import { fetchArticleText, extractReadableSummary } from './article-extractor';

interface ScraperConfig {
  reddit?: { clientId?: string; clientSecret?: string };
  twitter?: { apiKey?: string; apiSecret?: string };
  rss?: { feeds?: string[] };
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

  async scrapeReddit(limit = 10): Promise<NewsStory[]> {
    const stories: NewsStory[] = [];
    const subreddits = this.redditScraper.getFunnyNewsSubreddits();
    console.log(`Scraping Reddit (${subreddits.length} subreddits)…`);
    for (const sub of subreddits.slice(0, 5)) {
      try {
        const got = await this.redditScraper.getHotStories(sub, Math.ceil(limit / 5));
        stories.push(...got);
        await this.delay(500);
      } catch { continue; }
    }
    return stories.slice(0, limit);
  }

  async scrapeRSS(limit = 60): Promise<NewsStory[]> {
    console.log('Scraping RSS feeds…');
    const perFeed = Math.max(3, Math.ceil(limit / this.rssScraper.getFeedUrls().length));
    const stories = await this.rssScraper.parseAllFeeds(perFeed);
    return stories.slice(0, limit);
  }

  async scrapeHackerNews(limit = 10): Promise<NewsStory[]> {
    try {
      return await this.hnScraper.scrape(limit);
    } catch (e) {
      console.error('HN scraping failed:', e);
      return [];
    }
  }

  async enhanceWithAI(story: NewsStory): Promise<NewsStory> {
    try {
      const articleText = await fetchArticleText(story.url);
      const contentForAI = articleText || story.summary || story.content || '';

      const [{ text: enhancedSummary, model: aiModel }, aiTags, aiFunnyScore] = await Promise.all([
        llmClient.generateSummary(story.title, story.source, story.tags || [], contentForAI),
        llmClient.generateTags(story.title, story.source, contentForAI || undefined),
        llmClient.calculateFunnyScore(story.title, story.source, contentForAI || undefined, story.tags || []),
      ]);

      const combinedTags = [...new Set([...(story.tags || []), ...(aiTags || [])])].slice(0, 8);

      const fallbackSummary = contentForAI
        ? extractReadableSummary(contentForAI, story.title)
        : story.summary;

      return {
        ...story,
        summary: enhancedSummary || fallbackSummary || story.summary,
        content: contentForAI || story.content || null,
        tags: combinedTags,
        funny_score: Math.round((aiFunnyScore + (story.funny_score || 50)) / 2),
        ai_summary: !!(enhancedSummary),
        ai_model: enhancedSummary ? aiModel : null,
        ai_version: 1,
        needs_reprocess: !enhancedSummary,   // flag for reprocess if AI failed
      };
    } catch (error) {
      console.error('AI enhancement failed:', story.title, error);
      return { ...story, needs_reprocess: true };
    }
  }

  async scrapeAll(
    maxPerSource = 15,
  ): Promise<{ success: number; failed: number; total: number }> {
    console.log('Starting comprehensive scrape…', { maxPerSource });
    const results = { success: 0, failed: 0, total: 0 };
    const rssLimit = Math.max(60, maxPerSource * 4);

    const [redditStories, rssStories, twitterStories, hnStories] = await Promise.all([
      this.scrapeReddit(maxPerSource).catch(() => [] as NewsStory[]),
      this.scrapeRSS(rssLimit).catch(() => [] as NewsStory[]),
      this.twitterScraper.searchByHashtag('', 0).catch(() => [] as NewsStory[]),
      this.scrapeHackerNews(maxPerSource).catch(() => [] as NewsStory[]),
    ]);
    void twitterStories; // Twitter is a stub

    const allStories = [...redditStories, ...rssStories, ...hnStories];
    console.log(
      `Collected ${allStories.length} raw stories (reddit:${redditStories.length} rss:${rssStories.length} hn:${hnStories.length})`,
    );

    const unique = this.removeDuplicates(allStories);
    results.total = unique.length;

    const batchSize = 5;
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async story => {
          try {
            const [enhanced, ogImage] = await Promise.all([
              this.enhanceWithAI(story),
              story.image_url ? Promise.resolve(null) : this.fetchOgImage(story.url),
            ]);
            const final = { ...enhanced, image_url: enhanced.image_url || ogImage || null };
            const docId = this.urlToSlug(story.url, story.title || 'untitled');
            const saved = await adminUpsertStory(docId, final);
            if (saved.success) { results.success++; } else { results.failed++; }
          } catch {
            results.failed++;
          }
        }),
      );
      if (i + batchSize < unique.length) await this.delay(250);
    }

    console.log(`Scrape complete: ${results.success} saved, ${results.failed} failed`);
    return results;
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

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
      h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
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
    return stories.filter(s => {
      const key = s.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
