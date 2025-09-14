
import { NewsStory } from '@/types';

export class RedditScraper {
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getFunnyNewsSubreddits(): string[] {
    return [
      'nottheonion',        // Absurd real news that sounds like satire
      'NewsOfTheStupid',    // Stupid news stories
      'offbeat',            // Unusual, quirky, and offbeat news
      'FloridaMan',         // Classic Florida Man stories
      'WTF',                // What the f*** news
      'todayilearned',      // Interesting facts (often funny)
      'funny',              // General funny content
      'CrappyDesign',       // Bad design news
      'facepalm',           // News that makes you facepalm
      'mildlyinteresting',  // Interesting but not groundbreaking
      'AbsurdNews',         // Absurd news stories
      'BrandNewSentence',   // Weird headlines
    ];
  }

  // Legacy method for backwards compatibility
  getFunnySubreddits(): string[] {
    return ['nottheonion', 'funny', 'NewsOfTheStupid'];
  }

  async getHotStories(subreddit: string, limit: number = 10): Promise<NewsStory[]> {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
        {
          headers: {
            'User-Agent': 'FunnyNewsAggregator/1.0 (by /u/funnynews)',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.data?.children) {
        return [];
      }
      
      return data.data.children
        .filter((post: any) => this.isValidNewsPost(post.data))
        .slice(0, limit)
        .map((post: any) => this.transformRedditPostToNewsStory(post.data, subreddit));
    } catch (error) {
      console.error(`Error fetching stories from r/${subreddit}:`, error);
      return [];
    }
  }

  private isValidNewsPost(postData: any): boolean {
    // Filter out removed/deleted posts
    if (postData.removed_by_category || postData.removed || !postData.title) {
      return false;
    }
    
    // Filter out posts that are just images/videos without news context
    if (postData.is_video && !postData.selftext && !this.containsNewsKeywords(postData.title)) {
      return false;
    }
    
    // Filter out very short titles (likely not news)
    if (postData.title.length < 20) {
      return false;
    }
    
    // Filter out NSFW content for a family-friendly news site
    if (postData.over_18) {
      return false;
    }
    
    return true;
  }
  
  private containsNewsKeywords(title: string): boolean {
    const newsKeywords = [
      'news', 'report', 'announced', 'breaking', 'update', 'authorities',
      'police', 'government', 'official', 'study', 'research', 'arrested',
      'court', 'lawsuit', 'investigation', 'incident', 'emergency'
    ];
    
    const lowerTitle = title.toLowerCase();
    return newsKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  private transformRedditPostToNewsStory(postData: any, subreddit: string): NewsStory {
    // Extract summary from selftext or use title
    let summary = postData.selftext || '';
    if (summary.length > 300) {
      summary = summary.substring(0, 297) + '...';
    }
    
    // Generate tags based on subreddit and content
    const tags = this.generateTags(postData, subreddit);
    
    // Use Reddit URL for source, but original URL if it's a link post
    const sourceUrl = postData.url && !postData.url.includes('reddit.com') 
      ? postData.url 
      : `https://www.reddit.com${postData.permalink}`;
    
    return {
      title: postData.title,
      url: sourceUrl,
      source: `Reddit - r/${subreddit}`,
      source_type: 'reddit' as const,
      published_at: new Date(postData.created_utc * 1000),
      summary: summary || postData.title,
      content: postData.selftext,
      author: postData.author,
      funny_score: this.calculateInitialFunnyScore(postData, subreddit),
      upvotes: postData.score || 0,
      view_count: 0, // Reddit doesn't provide view count
      tags: tags,
      image_url: this.extractImageUrl(postData),
      metadata: {
        reddit_id: postData.id,
        reddit_permalink: postData.permalink,
        num_comments: postData.num_comments,
        created_utc: postData.created_utc,
        subreddit: subreddit,
        gilded: postData.gilded,
        awards: postData.total_awards_received
      }
    };
  }
  
  private generateTags(postData: any, subreddit: string): string[] {
    const tags: string[] = [subreddit.toLowerCase()];
    
    // Add content-based tags
    const title = postData.title.toLowerCase();
    const text = (postData.selftext || '').toLowerCase();
    const fullText = title + ' ' + text;
    
    // News category tags
    if (fullText.includes('florida')) tags.push('florida-man');
    if (fullText.includes('politics') || fullText.includes('government')) tags.push('politics');
    if (fullText.includes('tech') || fullText.includes('technology')) tags.push('tech');
    if (fullText.includes('science') || fullText.includes('research')) tags.push('science');
    if (fullText.includes('business') || fullText.includes('company')) tags.push('business');
    if (fullText.includes('celebrity') || fullText.includes('famous')) tags.push('celebrity');
    if (fullText.includes('viral') || fullText.includes('trending')) tags.push('viral');
    
    // Funny category tags
    if (fullText.includes('bizarre') || fullText.includes('weird')) tags.push('bizarre');
    if (fullText.includes('wtf') || fullText.includes('what the')) tags.push('wtf');
    if (fullText.includes('absurd') || fullText.includes('ridiculous')) tags.push('absurd');
    
    return tags.slice(0, 5); // Limit to 5 tags
  }
  
  private calculateInitialFunnyScore(postData: any, subreddit: string): number {
    let score = 50; // Base score
    
    // Subreddit-based scoring
    const subredditScores: { [key: string]: number } = {
      'nottheonion': 75,
      'NewsOfTheStupid': 80,
      'FloridaMan': 85,
      'WTF': 70,
      'AbsurdNews': 80,
      'offbeat': 65,
      'facepalm': 60
    };
    
    score = subredditScores[subreddit] || 50;
    
    // Engagement-based adjustments
    const upvoteRatio = postData.upvote_ratio || 0.5;
    if (upvoteRatio > 0.9) score += 10;
    else if (upvoteRatio < 0.6) score -= 10;
    
    // Comment activity (more comments = more engaging/funny)
    const commentScore = Math.min(postData.num_comments / 10, 10);
    score += commentScore;
    
    // Awards indicate quality content
    if (postData.total_awards_received > 0) {
      score += Math.min(postData.total_awards_received * 2, 15);
    }
    
    return Math.max(1, Math.min(100, Math.round(score)));
  }
  
  private extractImageUrl(postData: any): string | undefined {
    // Try to get preview image
    if (postData.preview?.images?.[0]?.source?.url) {
      return postData.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
    
    // Try thumbnail
    if (postData.thumbnail && postData.thumbnail !== 'self' && postData.thumbnail !== 'default') {
      return postData.thumbnail;
    }
    
    return undefined;
  }

  async getSpecificPost(postId: string, subreddit?: string): Promise<NewsStory | null> {
    try {
      const url = subreddit
        ? `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`
        : `https://www.reddit.com/comments/${postId}.json`;
      const response = await fetch(url);
      const data = await response.json();
      const post = data[0].data.children[0].data;
      return this.transformRedditPostToNewsStory(post, subreddit || 'unknown');
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      return null;
    }
  }
}
