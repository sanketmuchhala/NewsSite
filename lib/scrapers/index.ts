import { YouTubeScraper } from './youtube';
import { FreesoundScraper } from './freesound';
import { ArchiveScraper } from './archive';
import { Sound } from '@/types';
import { createSound, createSoundRelationship } from '@/lib/db';
import { geminiClient } from '@/lib/ai/gemini';

export interface ScraperConfig {
  youtube: {
    apiKey: string;
    enabled: boolean;
  };
  freesound: {
    apiKey: string;
    enabled: boolean;
  };
  archive: {
    enabled: boolean;
  };
}

export class WeirdSoundsScraper {
  private youtube?: YouTubeScraper;
  private freesound?: FreesoundScraper;
  private archive?: ArchiveScraper;

  constructor(config: ScraperConfig) {
    if (config.youtube.enabled && config.youtube.apiKey) {
      this.youtube = new YouTubeScraper(config.youtube.apiKey);
    }

    if (config.freesound.enabled && config.freesound.apiKey) {
      this.freesound = new FreesoundScraper(config.freesound.apiKey);
    }

    if (config.archive.enabled) {
      this.archive = new ArchiveScraper();
    }
  }

  async scrapeAll(maxPerSource: number = 10): Promise<{
    success: boolean;
    totalScraped: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      totalScraped: 0,
      errors: [] as string[]
    };

    console.log('🔍 Starting weird sounds scraping...');

    // Scrape from all available sources
    const scrapingTasks = [];

    if (this.youtube) {
      scrapingTasks.push(this.scrapeYouTube(maxPerSource));
    }

    if (this.freesound) {
      scrapingTasks.push(this.scrapeFreesound(maxPerSource));
    }

    if (this.archive) {
      scrapingTasks.push(this.scrapeArchive(maxPerSource));
    }

    if (scrapingTasks.length === 0) {
      results.errors.push('No scrapers enabled');
      results.success = false;
      return results;
    }

    // Execute all scraping tasks in parallel
    const scrapingResults = await Promise.allSettled(scrapingTasks);

    scrapingResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.totalScraped += result.value.scraped;
        if (result.value.errors.length > 0) {
          results.errors.push(...result.value.errors);
        }
      } else {
        results.errors.push(`Scraper ${index} failed: ${result.reason}`);
      }
    });

    if (results.errors.length > 0) {
      results.success = false;
    }

    console.log(`✅ Scraping completed. Total scraped: ${results.totalScraped}`);
    if (results.errors.length > 0) {
      console.warn('⚠️ Scraping errors:', results.errors);
    }

    return results;
  }

  private async scrapeYouTube(maxSounds: number): Promise<{ scraped: number; errors: string[] }> {
    if (!this.youtube) {
      return { scraped: 0, errors: ['YouTube scraper not initialized'] };
    }

    const result = { scraped: 0, errors: [] as string[] };

    try {
      console.log('📺 Scraping YouTube...');

      const queries = this.youtube.getWeirdQueries();
      const soundsPerQuery = Math.ceil(maxSounds / Math.min(queries.length, 3));

      // Use top 3 queries to avoid rate limiting
      for (const query of queries.slice(0, 3)) {
        try {
          console.log(`  🔍 YouTube query: "${query}"`);
          const sounds = await this.youtube.searchWeirdSounds(query, soundsPerQuery);

          for (const soundData of sounds) {
            try {
              // Enhance with AI if available
              const enhancedData = await this.enhanceWithAI(soundData);

              const dbResult = await createSound(enhancedData);
              if (dbResult.success) {
                result.scraped++;
                console.log(`    ✅ Added: ${enhancedData.title} ${enhancedData.description !== soundData.description ? '(AI enhanced)' : ''}`);
              } else {
                result.errors.push(`Failed to save YouTube sound: ${dbResult.error}`);
              }
            } catch (error) {
              result.errors.push(`Error saving YouTube sound: ${error}`);
            }
          }
        } catch (error) {
          result.errors.push(`YouTube query "${query}" failed: ${error}`);
        }

        // Add delay to respect rate limits
        await this.delay(1000);
      }
    } catch (error) {
      result.errors.push(`YouTube scraping failed: ${error}`);
    }

    return result;
  }

  private async scrapeFreesound(maxSounds: number): Promise<{ scraped: number; errors: string[] }> {
    if (!this.freesound) {
      return { scraped: 0, errors: ['Freesound scraper not initialized'] };
    }

    const result = { scraped: 0, errors: [] as string[] };

    try {
      console.log('🎵 Scraping Freesound...');

      const queries = this.freesound.getWeirdQueries();
      const soundsPerQuery = Math.ceil(maxSounds / Math.min(queries.length, 4));

      // Use top 4 queries
      for (const query of queries.slice(0, 4)) {
        try {
          console.log(`  🔍 Freesound query: "${query}"`);
          const sounds = await this.freesound.searchWeirdSounds(query, soundsPerQuery);

          for (const soundData of sounds) {
            try {
              // Enhance with AI if available
              const enhancedData = await this.enhanceWithAI(soundData);

              const dbResult = await createSound(enhancedData);
              if (dbResult.success) {
                result.scraped++;
                console.log(`    ✅ Added: ${enhancedData.title} ${enhancedData.description !== soundData.description ? '(AI enhanced)' : ''}`);
              } else {
                result.errors.push(`Failed to save Freesound sound: ${dbResult.error}`);
              }
            } catch (error) {
              result.errors.push(`Error saving Freesound sound: ${error}`);
            }
          }
        } catch (error) {
          result.errors.push(`Freesound query "${query}" failed: ${error}`);
        }

        // Add delay to respect rate limits
        await this.delay(1500);
      }
    } catch (error) {
      result.errors.push(`Freesound scraping failed: ${error}`);
    }

    return result;
  }

  private async scrapeArchive(maxSounds: number): Promise<{ scraped: number; errors: string[] }> {
    if (!this.archive) {
      return { scraped: 0, errors: ['Archive scraper not initialized'] };
    }

    const result = { scraped: 0, errors: [] as string[] };

    try {
      console.log('📚 Scraping Archive.org...');

      const queries = this.archive.getWeirdQueries();
      const soundsPerQuery = Math.ceil(maxSounds / Math.min(queries.length, 3));

      // Use top 3 queries
      for (const query of queries.slice(0, 3)) {
        try {
          console.log(`  🔍 Archive query: "${query}"`);
          const sounds = await this.archive.searchWeirdSounds(query, soundsPerQuery);

          for (const soundData of sounds) {
            try {
              // Enhance with AI if available
              const enhancedData = await this.enhanceWithAI(soundData);

              const dbResult = await createSound(enhancedData);
              if (dbResult.success) {
                result.scraped++;
                console.log(`    ✅ Added: ${enhancedData.title} ${enhancedData.description !== soundData.description ? '(AI enhanced)' : ''}`);
              } else {
                result.errors.push(`Failed to save Archive sound: ${dbResult.error}`);
              }
            } catch (error) {
              result.errors.push(`Error saving Archive sound: ${error}`);
            }
          }
        } catch (error) {
          result.errors.push(`Archive query "${query}" failed: ${error}`);
        }

        // Add delay to be respectful
        await this.delay(2000);
      }
    } catch (error) {
      result.errors.push(`Archive scraping failed: ${error}`);
    }

    return result;
  }

  async generateSoundRelationships(): Promise<{ created: number; errors: string[] }> {
    console.log('🕸️ Generating sound relationships...');

    const result = { created: 0, errors: [] as string[] };

    try {
      // Get all sounds from database
      const soundsResult = await import('@/lib/db').then(db =>
        db.getSounds(1, 1000) // Get up to 1000 sounds
      );

      if (!soundsResult.success || !soundsResult.data) {
        result.errors.push('Failed to fetch sounds for relationship generation');
        return result;
      }

      const sounds = soundsResult.data;

      // Generate relationships based on tag similarity
      for (let i = 0; i < sounds.length; i++) {
        for (let j = i + 1; j < sounds.length; j++) {
          const sound1 = sounds[i];
          const sound2 = sounds[j];

          // Calculate tag similarity
          const commonTags = sound1.tags.filter(tag => sound2.tags.includes(tag));
          const similarityScore = (commonTags.length * 2) / (sound1.tags.length + sound2.tags.length);

          if (similarityScore >= 0.3) { // At least 30% similarity
            try {
              const relationship = await createSoundRelationship(
                sound1.id,
                sound2.id,
                'tag_match',
                similarityScore * 10
              );

              if (relationship.success) {
                result.created++;
              } else {
                result.errors.push(`Failed to create relationship: ${relationship.error}`);
              }
            } catch (error) {
              result.errors.push(`Error creating relationship: ${error}`);
            }
          }
        }

        // Limit relationships per sound to avoid overwhelming the graph
        if (result.created > 500) break;
      }
    } catch (error) {
      result.errors.push(`Relationship generation failed: ${error}`);
    }

    console.log(`✅ Generated ${result.created} relationships`);
    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enhanceWithAI(sound: Omit<Sound, 'id' | 'created_at'>): Promise<Omit<Sound, 'id' | 'created_at'>> {
    try {
      // Only enhance if we have Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        return sound;
      }

      console.log(`    🤖 AI enhancing: ${sound.title}`);

      // Generate enhanced description if missing or short
      let enhancedDescription = sound.description;
      if (!sound.description || sound.description.length < 50) {
        const aiDescription = await geminiClient.generateSoundDescription(sound.title, sound.tags);
        if (aiDescription) {
          enhancedDescription = aiDescription;
        }
      }

      // Get AI-suggested tags and merge with existing
      const aiTags = await geminiClient.categorizeSound(sound.title, enhancedDescription);
      const mergedTags = Array.from(new Set([...sound.tags, ...aiTags])).slice(0, 12);

      // Get AI-calculated weirdness score (use as fallback or average)
      const aiWeirdness = await geminiClient.calculateWeirdnessScore(sound.title, enhancedDescription, mergedTags);
      const finalWeirdness = sound.weirdness_score > 0
        ? Math.round(((sound.weirdness_score + aiWeirdness) / 2) * 10) / 10
        : aiWeirdness;

      return {
        ...sound,
        description: enhancedDescription,
        tags: mergedTags,
        weirdness_score: finalWeirdness
      };

    } catch (error) {
      console.error('AI enhancement failed:', error);
      return sound; // Return original if AI fails
    }
  }

  // Manual scraping methods for specific items
  async scrapeYouTubeVideo(videoId: string, startTime?: number, endTime?: number): Promise<{ success: boolean; error?: string }> {
    if (!this.youtube) {
      return { success: false, error: 'YouTube scraper not initialized' };
    }

    try {
      const soundData = await this.youtube.scrapeSpecificVideo(videoId, startTime, endTime);
      if (!soundData) {
        return { success: false, error: 'Failed to fetch YouTube video data' };
      }

      const dbResult = await createSound(soundData);
      return { success: dbResult.success, error: dbResult.error };
    } catch (error) {
      return { success: false, error: `Error: ${error}` };
    }
  }

  async scrapeFreesoundById(soundId: number): Promise<{ success: boolean; error?: string }> {
    if (!this.freesound) {
      return { success: false, error: 'Freesound scraper not initialized' };
    }

    try {
      const soundData = await this.freesound.getSoundById(soundId);
      if (!soundData) {
        return { success: false, error: 'Failed to fetch Freesound data' };
      }

      const dbResult = await createSound(soundData);
      return { success: dbResult.success, error: dbResult.error };
    } catch (error) {
      return { success: false, error: `Error: ${error}` };
    }
  }

  async scrapeArchiveItem(identifier: string): Promise<{ success: boolean; error?: string }> {
    if (!this.archive) {
      return { success: false, error: 'Archive scraper not initialized' };
    }

    try {
      const soundData = await this.archive.getItemByIdentifier(identifier);
      if (!soundData) {
        return { success: false, error: 'Failed to fetch Archive.org data' };
      }

      const dbResult = await createSound(soundData);
      return { success: dbResult.success, error: dbResult.error };
    } catch (error) {
      return { success: false, error: `Error: ${error}` };
    }
  }
}