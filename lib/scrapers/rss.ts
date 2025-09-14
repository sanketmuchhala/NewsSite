
import Parser from 'rss-parser';
import { NewsStory } from '@/types';

export class RssScraper {
  private feeds: string[];
  private parser: Parser;

  constructor(feeds?: string[]) {
    this.feeds = feeds || this.getDefaultFunnyNewsFeeds();
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'FunnyNewsAggregator/1.0 (+https://funnynews.com/bot)',
      },
    });
  }

  getDefaultFunnyNewsFeeds(): string[] {
    return [
      // Satirical News
      'https://feeds.theonion.com/onion/daily',                    // The Onion
      'https://babylonbee.com/feed',                               // Babylon Bee
      'https://www.clickhole.com/rss',                            // ClickHole
      'https://reductress.com/feed/',                             // Reductress
      
      // Weird News
      'https://www.upi.com/rss/Odd_News/',                        // UPI Odd News
      'https://feeds.reuters.com/reuters/oddlyEnoughNews',         // Reuters Odd News
      'https://abcnews.go.com/Entertainment/wireStory?rss=true',  // ABC Entertainment
      
      // Tech/Internet Culture (often funny)
      'https://feeds.mashable.com/Mashable',                      // Mashable
      'https://feeds.arstechnica.com/arstechnica/index',          // Ars Technica
      
      // General Weird/Interesting
      'https://www.mentalfloss.com/feed',                         // Mental Floss
      'https://www.boredpanda.com/feed/',                         // Bored Panda
      'https://www.cracked.com/feeds/rss.xml',                    // Cracked
    ];
  }

  getFeedUrls(): string[] {
    return this.feeds;
  }

  async parseFeed(feedUrl: string, limit: number): Promise<NewsStory[]> {
    try {
      console.log(`Parsing RSS feed: ${feedUrl}`);
      const feed = await this.parser.parseURL(feedUrl);
      
      if (!feed.items || feed.items.length === 0) {
        console.warn(`No items found in feed: ${feedUrl}`);
        return [];
      }
      
      return feed.items
        .filter(item => this.isValidNewsItem(item))
        .slice(0, limit)
        .map(item => this.transformRssItemToNewsStory(item, feed));
    } catch (error) {
      console.error(`Error parsing feed ${feedUrl}:`, error);
      return [];
    }
  }
  
  async parseAllFeeds(limitPerFeed: number = 5): Promise<NewsStory[]> {
    const allStories: NewsStory[] = [];
    
    for (const feedUrl of this.feeds) {
      try {
        const stories = await this.parseFeed(feedUrl, limitPerFeed);
        allStories.push(...stories);
      } catch (error) {
        console.error(`Failed to parse feed ${feedUrl}:`, error);
        continue;
      }
    }
    
    // Sort by publication date (newest first)
    return allStories.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    });
  }
  
  private isValidNewsItem(item: any): boolean {
    // Must have title and link
    if (!item.title || !item.link) {
      return false;
    }
    
    // Filter out very short titles
    if (item.title.length < 10) {
      return false;
    }
    
    // Filter out items that are too old (older than 30 days)
    if (item.pubDate) {
      const itemDate = new Date(item.pubDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (itemDate < thirtyDaysAgo) {
        return false;
      }
    }
    
    return true;
  }
  
  private transformRssItemToNewsStory(item: any, feed: any): NewsStory {
    // Clean and truncate summary
    let summary = item.contentSnippet || item.content || item.summary || '';
    summary = this.cleanHtmlTags(summary);
    if (summary.length > 300) {
      summary = summary.substring(0, 297) + '...';
    }
    
    // Extract and clean content
    let content = item.content || item['content:encoded'] || summary;
    content = this.cleanHtmlTags(content);
    
    // Generate tags based on feed and content
    const tags = this.generateTags(item, feed);
    
    // Calculate initial funny score based on source
    const funnyScore = this.calculateInitialFunnyScore(feed.title || '', item.title);
    
    return {
      title: this.cleanTitle(item.title),
      url: item.link,
      source: feed.title || this.extractDomainFromUrl(item.link),
      source_type: 'rss' as const,
      published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
      summary: summary,
      content: content,
      author: item.creator || item.author || item['dc:creator'] || undefined,
      funny_score: funnyScore,
      upvotes: 0, // RSS doesn't provide upvotes
      view_count: 0,
      tags: tags,
      image_url: this.extractImageUrl(item),
      metadata: {
        rss_guid: item.guid || item.id,
        feed_url: feed.feedUrl,
        feed_title: feed.title,
        categories: item.categories || [],
        pub_date_original: item.pubDate
      }
    };
  }
  
  private generateTags(item: any, feed: any): string[] {
    const tags: string[] = [];
    
    // Add feed-based tags
    const feedTitle = (feed.title || '').toLowerCase();
    if (feedTitle.includes('onion')) tags.push('satire', 'onion');
    else if (feedTitle.includes('babylon bee')) tags.push('satire', 'babylon-bee');
    else if (feedTitle.includes('clickhole')) tags.push('satire', 'clickhole');
    else if (feedTitle.includes('reductress')) tags.push('satire', 'reductress');
    else if (feedTitle.includes('odd') || feedTitle.includes('weird')) tags.push('weird', 'odd-news');
    else if (feedTitle.includes('tech')) tags.push('tech');
    else if (feedTitle.includes('entertainment')) tags.push('entertainment');
    
    // Add category-based tags
    if (item.categories) {
      for (const category of item.categories) {
        const cleanCategory = category.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        
        if (cleanCategory && cleanCategory.length <= 20 && !tags.includes(cleanCategory)) {
          tags.push(cleanCategory);
        }
      }
    }
    
    // Add content-based tags
    const text = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase();
    if (text.includes('florida')) tags.push('florida-man');
    if (text.includes('trump')) tags.push('politics');
    if (text.includes('biden')) tags.push('politics');
    if (text.includes('viral')) tags.push('viral');
    if (text.includes('weird') || text.includes('bizarre')) tags.push('bizarre');
    if (text.includes('funny') || text.includes('hilarious')) tags.push('humor');
    
    return tags.slice(0, 5); // Limit to 5 tags
  }
  
  private calculateInitialFunnyScore(feedTitle: string, itemTitle: string): number {
    let score = 50; // Base score
    
    const feedLower = feedTitle.toLowerCase();
    const titleLower = itemTitle.toLowerCase();
    
    // Satirical sources get high scores
    if (feedLower.includes('onion')) score = 85;
    else if (feedLower.includes('babylon bee')) score = 80;
    else if (feedLower.includes('clickhole')) score = 90;
    else if (feedLower.includes('reductress')) score = 75;
    else if (feedLower.includes('cracked')) score = 70;
    
    // Odd news sources
    else if (feedLower.includes('odd') || feedLower.includes('weird')) score = 70;
    
    // Content-based adjustments
    const funnyKeywords = ['bizarre', 'weird', 'absurd', 'ridiculous', 'hilarious', 'wtf', 'florida man'];
    const funnyCount = funnyKeywords.filter(keyword => titleLower.includes(keyword)).length;
    score += funnyCount * 5;
    
    return Math.max(1, Math.min(100, Math.round(score)));
  }
  
  private cleanTitle(title: string): string {
    return title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  
  private cleanHtmlTags(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  private extractImageUrl(item: any): string | undefined {
    // Try various possible image fields
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
      return item.enclosure.url;
    }
    
    if (item['media:thumbnail']?.['@_url']) {
      return item['media:thumbnail']['@_url'];
    }
    
    if (item['media:content']?.['@_url'] && item['media:content']['@_type']?.startsWith('image/')) {
      return item['media:content']['@_url'];
    }
    
    // Try to extract image from content
    if (item.content || item['content:encoded']) {
      const content = item.content || item['content:encoded'];
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }
    
    return undefined;
  }
  
  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return 'Unknown Source';
    }
  }
}
