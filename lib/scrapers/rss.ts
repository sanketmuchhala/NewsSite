import Parser from 'rss-parser';
import { NewsStory } from '@/types';

// Feed categories — each entry is [url, label]
// All feeds validated as accessible (no 403/404).
const FEEDS = {
  satire: [
    ['https://theonion.com/feed/',                              'The Onion'],
    ['https://www.clickhole.com/rss',                          'ClickHole'],
    ['https://reductress.com/feed/',                           'Reductress'],
    ['https://babylonbee.com/feed',                            'Babylon Bee'],
    ['https://thebeaverton.com/feed/',                         'The Beaverton'],
    ['https://www.thedailymash.co.uk/feed/',                   'The Daily Mash'],
    ['https://waterfordwhispersnews.com/feed/',                'Waterford Whispers'],
    ['https://www.theshovel.com.au/feed/',                     'The Shovel'],
    ['https://www.duffelblog.com/feed/',                       'Duffel Blog'],
    ['https://thehardtimes.net/feed/',                         'The Hard Times'],
  ],
  weird: [
    ['https://www.upi.com/rss/Odd_News/',                      'UPI Odd News'],
    ['https://www.reddit.com/r/nottheonion/.rss',              'r/nottheonion'],
    ['https://www.reddit.com/r/FloridaMan/.rss',               'r/FloridaMan'],
    ['https://nypost.com/weird-but-true/feed/',                'NY Post Weird'],
    ['https://www.mentalfloss.com/feed',                       'Mental Floss'],
    ['https://www.cracked.com/feeds/rss.xml',                  'Cracked'],
    ['https://feeds.mashable.com/Mashable',                    'Mashable'],
    ['https://www.oddee.com/feed/',                            'Oddee'],
    ['https://www.vice.com/en/rss',                            'Vice'],
    ['https://kotaku.com/rss',                                 'Kotaku'],
  ],
  tech: [
    ['https://www.theverge.com/rss/index.xml',                 'The Verge'],
    ['https://feeds.arstechnica.com/arstechnica/index',        'Ars Technica'],
    ['https://techcrunch.com/feed/',                           'TechCrunch'],
    ['https://gizmodo.com/rss',                                'Gizmodo'],
    ['https://feeds.wired.com/wired/index',                    'Wired'],
    ['https://www.theregister.com/headlines.atom',             'The Register'],
    ['https://www.404media.co/rss/',                           '404 Media'],
    ['https://rss.slashdot.org/Slashdot/slashdotMain',        'Slashdot'],
  ],
  weed: [
    // NSFW Reddit subs (r/trees, r/weed, r/ents) require login — blocked
    // Using dedicated cannabis media instead
    ['https://merryjane.com/feed/',                            'Merry Jane'],
    ['https://www.hightimes.com/feed/',                        'High Times'],
  ],
} as const;

// Flat list for default scraping — all categories
function getAllFeeds(): string[] {
  return Object.values(FEEDS).flatMap(cat => cat.map(([url]) => url));
}

// Lookup tables built from FEEDS
const FEED_LABELS: Record<string, string> = {};
const FEED_CATEGORY: Record<string, string> = {};
for (const [cat, entries] of Object.entries(FEEDS)) {
  for (const [url, label] of entries as readonly (readonly [string, string])[]) {
    FEED_LABELS[url]    = label;
    FEED_CATEGORY[url]  = cat;
  }
}

function feedCategory(feedUrl: string): string {
  return FEED_CATEGORY[feedUrl] ?? 'weird';
}

// ── Tag keywords ─────────────────────────────────────────────────────────────

const TAG_RULES: [RegExp, string[]][] = [
  [/cannabis|marijuana|weed|420|stoner|stoned|high |dispensary|\bthc\b|\bcbd\b|bong|joint|blunt|edible|dab(bing)?/i, ['weed', '420', 'cannabis']],
  [/florida man|florida woman/i,                         ['florida-man', 'weird']],
  [/artificial intelligence|\bai\b|openai|chatgpt|llm|machine learning/i, ['ai', 'tech']],
  [/apple|google|meta(?! data)|microsoft|amazon|tesla|spacex|elon musk/i, ['tech', 'big-tech']],
  [/startup|silicon valley|venture capital|\bvc\b|ipo|funding round/i,    ['tech', 'startup']],
  [/arrested|charged|police|lawsuit|court|judge|prison|sentence/i,        ['law', 'crime']],
  [/trump|biden|congress|senate|democrat|republican|election|white house/i,['politics']],
  [/climate|environment|fossil fuel|renewable|carbon|electric vehicle/i,  ['science', 'climate']],
  [/nasa|space|rocket|astronaut|mars|moon|orbit/i,                        ['science', 'space']],
  [/crypto|bitcoin|blockchain|nft|web3/i,                                  ['tech', 'crypto']],
  [/tiktok|instagram|twitter|youtube|social media|viral/i,                 ['viral', 'social-media']],
  [/wtf|bizarre|absurd|insane|unbelievable/i,                              ['wtf', 'bizarre']],
  [/cat|dog|bird|bear|alligator|gator|snake|shark|goat|chicken|cow|monkey|raccoon|squirrel|deer/i, ['animals']],
  [/celebrity|actor|actress|singer|rapper|kardashian|taylor swift|beyoncé/i, ['celebrity']],
  [/satire|spoof|parody|fake news/i,                                       ['satire']],
  [/gun|shooting|weapon|armed/i,                                           ['crime']],
  [/drunk|dui|alcohol|beer|whiskey/i,                                      ['weird']],
  [/scam|fraud|hack|breach|stolen|theft/i,                                 ['crime', 'tech']],
  [/study|research|scientists?|university|published/i,                     ['science']],
];

function inferTags(title: string, summary: string, category: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  const tags = new Set<string>([category]);

  for (const [pattern, t] of TAG_RULES) {
    if (pattern.test(text)) t.forEach(tag => tags.add(tag));
  }
  return [...tags].slice(0, 7);
}

// ── Funny score ───────────────────────────────────────────────────────────────

function calcFunnyScore(feedUrl: string, feedTitle: string, itemTitle: string): number {
  const ft = (feedTitle || feedUrl).toLowerCase();
  const it = itemTitle.toLowerCase();

  // Source-based baseline
  let score =
    ft.includes('onion')    || ft.includes('clickhole') ? 92 :
    ft.includes('babylon')                               ? 82 :
    ft.includes('beaverton')|| ft.includes('shovel')    ? 80 :
    ft.includes('mash')     || ft.includes('whispers')  ? 80 :
    ft.includes('reductress')                            ? 78 :
    ft.includes('hard time')                             ? 76 :
    ft.includes('duffel')                                ? 76 :
    ft.includes('cracked')                               ? 72 :
    ft.includes('merry jane')|| ft.includes('high times')? 74 :
    ft.includes('trees')    || ft.includes('weed')      ? 68 :
    ft.includes('nottheonion')||ft.includes('florida')  ? 70 :
    ft.includes('wtf')      || ft.includes('facepalm')  ? 68 :
    ft.includes('tifu')                                  ? 65 :
    ft.includes('odd')      || ft.includes('weird')     ? 65 :
    ft.includes('gizmodo')  || ft.includes('verge')     ? 52 :
    ft.includes('programmer')                            ? 60 :
    48;

  // Title-based bonuses
  const funnyWords = ['man', 'woman', 'arrested', 'accidentally', 'dies', 'shoots', 'discovers',
    'claims', 'demands', 'refuses', 'confirms', 'bans', 'declares', 'escapes', 'steals',
    'weed', 'cannabis', 'high', '420', 'stoned', 'drunk', 'naked'];
  score += funnyWords.filter(w => it.includes(w)).length * 2;

  return Math.max(1, Math.min(100, Math.round(score)));
}

// ── Reddit link extraction ────────────────────────────────────────────────────

/**
 * For Reddit RSS link-posts, the [link] anchor in content:encoded points to
 * the actual external article URL.  Returns null for text posts or if the
 * link is just the Reddit thread.
 */
function extractRedditArticleUrl(item: any): string | null {
  const raw = item['content:encoded'] || item.content || '';
  if (!raw) return null;

  // Decode common HTML entities and strip CDATA
  const html = raw
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

  // Find <a href="URL">[link]</a>
  const m = html.match(/<a\s+href="([^"]+)"[^>]*>\s*\[link\]\s*<\/a>/i);
  if (!m) return null;
  const url = m[1].trim();
  // Ignore if it's just the Reddit thread URL
  if (url.includes('reddit.com')) return null;
  return url;
}

// ── Main scraper class ────────────────────────────────────────────────────────

export class RssScraper {
  private feeds: string[];
  private parser: Parser;

  constructor(feeds?: string[]) {
    this.feeds = feeds || getAllFeeds();
    this.parser = new Parser({
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'Cache-Control': 'no-cache',
      },
      customFields: {
        feed: ['language', 'copyright'],
        item: ['media:thumbnail', 'media:content', 'content:encoded', 'dc:creator'],
      },
    });
  }

  getFeedUrls(): string[] { return this.feeds; }

  async parseFeed(feedUrl: string, limit: number): Promise<NewsStory[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      if (!feed.items?.length) return [];

      return feed.items
        .filter(item => this.isValid(item))
        .slice(0, limit)
        .map(item => this.transform(item, feed, feedUrl));
    } catch (err) {
      console.warn(`RSS feed failed [${feedUrl.split('/').slice(2, 3).join('')}]:`, (err as Error).message?.slice(0, 80));
      return [];
    }
  }

  async parseAllFeeds(limitPerFeed = 4): Promise<NewsStory[]> {
    console.log(`Parsing ${this.feeds.length} RSS feeds (${limitPerFeed}/feed)…`);
    const batchSize = 4;
    const all: NewsStory[] = [];

    for (let i = 0; i < this.feeds.length; i += batchSize) {
      const batch = this.feeds.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(url => this.parseFeed(url, limitPerFeed))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') all.push(...r.value);
      }
      if (i + batchSize < this.feeds.length) await new Promise(r => setTimeout(r, 400));
    }

    console.log(`RSS total: ${all.length} stories from ${this.feeds.length} feeds`);
    return all.sort((a, b) =>
      new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private isValid(item: any): boolean {
    if (!item.title || !item.link || item.title.length < 10) return false;
    // Skip items older than 60 days
    if (item.pubDate) {
      const age = Date.now() - new Date(item.pubDate).getTime();
      if (age > 60 * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  }

  private transform(item: any, feed: any, feedUrl: string): NewsStory {
    const category = feedCategory(feedUrl);
    const isReddit = feedUrl.includes('reddit.com');

    // For Reddit link-posts, try to get the real article URL
    const realUrl = isReddit ? (extractRedditArticleUrl(item) ?? item.link) : item.link;

    // Clean summary — strip "submitted by /u/..." Reddit noise
    let summary = this.cleanHtml(item.contentSnippet || item.content || item.summary || '');
    if (isReddit) {
      // Remove Reddit boilerplate: "submitted by /u/X [link] [comments]"
      summary = summary.replace(/submitted by \/u\/\S+\s*(\[link\])?\s*(\[comments\])?/gi, '').trim();
    }
    summary = summary.slice(0, 350);

    const title = this.cleanTitle(item.title);
    const source = FEED_LABELS[feedUrl] || feed.title || this.domain(item.link);
    const tags = inferTags(title, summary, category);
    const funny_score = calcFunnyScore(feedUrl, feed.title || '', title);
    const image_url = this.extractImage(item) || undefined;

    return {
      slug: '',   // filled in by scrapeAll via urlToSlug
      title,
      url: realUrl,
      source,
      source_type: 'rss',
      category,
      feed_url: feedUrl,
      rss_guid: (item.guid || item.id || null) as string | null,
      reddit_id: null,
      reddit_permalink: null,
      hn_id: null,
      published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
      summary,
      content: null,
      author: (item['dc:creator'] || item.creator || item.author || null) as string | null,
      funny_score,
      quality_score: 0,
      ai_summary: false,
      ai_model: null,
      ai_version: 0,
      needs_reprocess: false,
      upvotes: 0,
      downvotes: 0,
      view_count: 0,
      content_status: 'unknown' as const,
      tags,
      image_url: image_url ?? null,
      scraped_at: null,
      created_at: null,
      updated_at: null,
    };
  }

  private cleanTitle(t: string): string {
    return t
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  private cleanHtml(t: string): string {
    return t
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  private extractImage(item: any): string | null {
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) return item.enclosure.url;
    if (item['media:thumbnail']?.['@_url']) return item['media:thumbnail']['@_url'];
    if (item['media:content']?.['@_url'] && item['media:content']['@_type']?.startsWith('image/')) {
      return item['media:content']['@_url'];
    }
    const raw = item['content:encoded'] || item.content || '';
    const m = raw.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    return m?.[1] ?? null;
  }

  private domain(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Unknown'; }
  }
}
