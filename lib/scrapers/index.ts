
import { RedditScraper } from './reddit';
import { TwitterScraper } from './twitter';
import { RssScraper } from './rss';
import { NewsStory } from '@/types';
import { createStory, createStoryRelationship } from '@/lib/db';
import { geminiClient } from '@/lib/ai/gemini';

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

  constructor(config: ScraperConfig = {}) {
    this.redditScraper = new RedditScraper(config.reddit?.clientId, config.reddit?.clientSecret);
    this.twitterScraper = new TwitterScraper(config.twitter?.apiKey, config.twitter?.apiSecret);
    this.rssScraper = new RssScraper(config.rss?.feeds);
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

  async scrapeRSS(limit: number = 20): Promise<NewsStory[]> {
    console.log('Scraping RSS feeds...');
    const stories = await this.rssScraper.parseAllFeeds(Math.ceil(limit / 10));
    console.log(`Scraped ${stories.length} stories from RSS feeds`);
    return stories.slice(0, limit);
  }

  async enhanceNewsStoryWithAI(story: NewsStory): Promise<NewsStory> {
    try {
      console.log(`Enhancing story with AI: ${story.title}`);
      
      // Use Gemini to enhance the story
      const [enhancedSummary, aiTags, aiFunnyScore] = await Promise.all([
        geminiClient.generateNewsStoryAnalysis(
          story.title, 
          story.source, 
          story.tags || []
        ),
        geminiClient.categorizeNewsStory(
          story.title, 
          story.source, 
          story.summary || undefined
        ),
        geminiClient.calculateFunnyScore(
          story.title, 
          story.source, 
          story.summary || undefined, 
          story.tags || []
        )
      ]);
      
      // Merge AI-generated tags with existing tags
      const combinedTags = [...new Set([
        ...(story.tags || []),
        ...(aiTags || [])
      ])].slice(0, 8); // Limit to 8 tags total
      
      return {
        ...story,
        summary: enhancedSummary || story.summary,
        tags: combinedTags,
        funny_score: Math.round((aiFunnyScore + (story.funny_score || 50)) / 2), // Average AI and initial score
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
      return story; // Return original story if AI enhancement fails
    }
  }

  async generateStoryRelationships(stories: NewsStory[]): Promise<void> {
    console.log(`Generating relationships for ${stories.length} stories...`);
    
    // Simple relationship generation based on shared tags and similar titles
    for (let i = 0; i < stories.length; i++) {
      for (let j = i + 1; j < stories.length; j++) {
        const story1 = stories[i];
        const story2 = stories[j];
        
        if (!story1.id || !story2.id) continue;
        
        const relationship = this.calculateStoryRelationship(story1, story2);
        
        if (relationship.strength > 0.3) {
          try {
            await createStoryRelationship(
              story1.id,
              story2.id,
              relationship.type,
              relationship.strength
            );
          } catch (error) {
            console.error('Failed to create story relationship:', error);
          }
        }
      }
    }
  }
  
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
    console.log('Starting comprehensive news scraping...', {
      maxPerSource,
      environment: process.env.NODE_ENV,
      hasDatabase: !!process.env.POSTGRES_URL,
      hasAI: !!process.env.GOOGLE_AI_API_KEY
    });
    
    const results = { success: 0, failed: 0, total: 0 };
    
    try {
      // Check if we have database connection
      if (!process.env.POSTGRES_URL) {
        console.warn('No database connection available. Stories will not be saved.');
        throw new Error('Database connection not configured. Please set POSTGRES_URL environment variable.');
      }
      
      // Scrape from all sources with proper error isolation
      console.log('Starting to scrape from all sources...');
      
      const scrapePromises = [
        this.scrapeReddit(maxPerSource)
          .catch(error => {
            console.error('Reddit scraping failed:', error.message || error);
            return [];
          }),
        this.scrapeRSS(maxPerSource)
          .catch(error => {
            console.error('RSS scraping failed:', error.message || error);
            return [];
          }),
        this.scrapeTwitter(maxPerSource)
          .catch(error => {
            console.error('Twitter scraping failed:', error.message || error);
            return [];
          })
      ];
      
      // Execute all scraping operations in parallel
      const [redditStories, rssStories, twitterStories] = await Promise.allSettled(scrapePromises)
        .then(results => results.map(result => 
          result.status === 'fulfilled' ? result.value : []
        ));
      
      const allStories: NewsStory[] = [
        ...redditStories,
        ...rssStories,
        ...twitterStories
      ];
      
      console.log(`Total stories collected: ${allStories.length}`, {
        reddit: redditStories.length,
        rss: rssStories.length,
        twitter: twitterStories.length
      });
      
      results.total = allStories.length;
      
      if (allStories.length === 0) {
        console.warn('No stories were collected from any source');
        return results;
      }
      
      // Remove duplicates based on URL
      const uniqueStories = this.removeDuplicates(allStories);
      console.log(`Unique stories after deduplication: ${uniqueStories.length}`);
      
      // Enhance stories with AI and save to database
      // Process in smaller batches to avoid serverless timeout
      const batchSize = 5;
      const totalBatches = Math.ceil(uniqueStories.length / batchSize);
      
      for (let i = 0; i < uniqueStories.length; i += batchSize) {
        const batch = uniqueStories.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${totalBatches} (${batch.length} stories)`);
        
        const batchPromises = batch.map(async (story) => {
          try {
            const enhancedStory = await this.enhanceNewsStoryWithAI(story);
            const savedResult = await createStory(enhancedStory);
            
            if (savedResult.success && savedResult.data?.id) {
              enhancedStory.id = savedResult.data.id;
              results.success++;
              return enhancedStory;
            } else {
              console.warn('Failed to save story:', savedResult.error);
              results.failed++;
              return null;
            }
          } catch (error) {
            console.error('Failed to save story:', story.title, error);
            results.failed++;
            return null;
          }
        });
        
        // Process batch with shorter delay for serverless
        await Promise.allSettled(batchPromises);
        
        // Smaller delay to prevent overwhelming APIs
        if (i + batchSize < uniqueStories.length) {
          await this.delay(250);
        }
      }
      
      // Generate story relationships (only if we have saved stories)
      const savedStories = uniqueStories.filter(s => s.id);
      if (savedStories.length > 1) {
        console.log(`Generating relationships for ${savedStories.length} saved stories...`);
        try {
          await this.generateStoryRelationships(savedStories);
        } catch (error) {
          console.error('Failed to generate relationships:', error);
          // Don't fail the entire operation for relationship errors
        }
      }
      
      console.log(`Scraping complete: ${results.success} saved, ${results.failed} failed`);
      return results;
      
    } catch (error) {
      console.error('Scraping process failed:', error);
      
      // Provide more context about the failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Database')) {
        throw new Error(`Database error: ${errorMessage}`);
      } else if (errorMessage.includes('timeout')) {
        throw new Error(`Timeout error: ${errorMessage}`);
      } else {
        throw new Error(`Scraping failed: ${errorMessage}`);
      }
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
