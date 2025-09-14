import { Sound } from '@/types';

interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeVideoDetails {
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    dislikeCount?: string;
  };
}

export class YouTubeScraper {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchWeirdSounds(query: string, maxResults: number = 20): Promise<Omit<Sound, 'id' | 'created_at'>[]> {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${this.apiKey}`;

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.items) {
        throw new Error('No search results found');
      }

      const videoIds = searchData.items.map((item: YouTubeSearchResult) => item.id.videoId);
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(',')}&key=${this.apiKey}`;

      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      const sounds: Omit<Sound, 'id' | 'created_at'>[] = [];

      for (let i = 0; i < searchData.items.length; i++) {
        const item: YouTubeSearchResult = searchData.items[i];
        const details: YouTubeVideoDetails = detailsData.items[i];

        if (!item.id?.videoId) continue;

        const duration = this.parseDuration(details.contentDetails.duration);
        const weirdnessScore = this.calculateWeirdnessScore(item, details);

        const sound: Omit<Sound, 'id' | 'created_at'> = {
          title: item.snippet.title,
          source_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          source_type: 'youtube',
          duration,
          tags: this.extractTags(item.snippet.title, item.snippet.description),
          description: item.snippet.description.slice(0, 500),
          thumbnail_url: item.snippet.thumbnails.medium?.url,
          metadata: {
            youtube_id: item.id.videoId,
            author: item.snippet.channelTitle,
            license: 'YouTube Standard License',
          },
          weirdness_score: weirdnessScore,
        };

        sounds.push(sound);
      }

      return sounds;
    } catch (error) {
      console.error('YouTube scraping error:', error);
      throw error;
    }
  }

  async scrapeSpecificVideo(videoId: string, startTime?: number, endTime?: number): Promise<Omit<Sound, 'id' | 'created_at'> | null> {
    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.apiKey}`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found');
      }

      const item = data.items[0];
      const duration = this.parseDuration(item.contentDetails.duration);
      const weirdnessScore = this.calculateWeirdnessScore(item, item);

      const sound: Omit<Sound, 'id' | 'created_at'> = {
        title: item.snippet.title,
        source_url: `https://www.youtube.com/watch?v=${videoId}`,
        source_type: 'youtube',
        duration,
        tags: this.extractTags(item.snippet.title, item.snippet.description),
        description: item.snippet.description.slice(0, 500),
        thumbnail_url: item.snippet.thumbnails.medium?.url,
        metadata: {
          youtube_id: videoId,
          author: item.snippet.channelTitle,
          license: 'YouTube Standard License',
          start_time: startTime,
          end_time: endTime,
        },
        weirdness_score: weirdnessScore,
      };

      return sound;
    } catch (error) {
      console.error('YouTube video scraping error:', error);
      return null;
    }
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (match[1] ? parseInt(match[1]) : 0);
    const minutes = (match[2] ? parseInt(match[2]) : 0);
    const seconds = (match[3] ? parseInt(match[3]) : 0);

    return hours * 3600 + minutes * 60 + seconds;
  }

  private calculateWeirdnessScore(item: YouTubeSearchResult, details: YouTubeVideoDetails): number {
    let score = 5; // Base score

    const title = item.snippet.title.toLowerCase();
    const description = item.snippet.description.toLowerCase();
    const text = title + ' ' + description;

    // Weird keywords increase score
    const weirdKeywords = [
      'cursed', 'liminal', 'backrooms', 'nightmare', 'unsettling',
      'disturbing', 'eerie', 'haunting', 'strange', 'bizarre',
      'experimental', 'glitch', 'corrupted', 'vintage', 'old',
      'forbidden', 'lost', 'hidden', 'secret', 'mystery',
      'ambient', 'drone', 'static', 'noise', 'distorted',
      'analog', 'vhs', 'tape', 'found footage', 'creepy'
    ];

    weirdKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.5;
      }
    });

    // Low view count might indicate weirdness
    const viewCount = parseInt(details.statistics.viewCount);
    if (viewCount < 1000) score += 1;
    else if (viewCount < 10000) score += 0.5;

    // Unusual like/dislike ratio
    const likeCount = parseInt(details.statistics.likeCount);
    const dislikeCount = parseInt(details.statistics.dislikeCount || '0');
    if (dislikeCount > likeCount) score += 1;

    // Cap the score
    return Math.min(Math.max(score, 1), 10);
  }

  private extractTags(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const tags: string[] = [];

    // Define tag categories with keywords
    const tagCategories: Record<string, string[]> = {
      cursed: ['cursed', 'forbidden', 'haunted'],
      liminal: ['liminal', 'backrooms', 'liminality'],
      experimental: ['experimental', 'avant-garde', 'abstract'],
      ambient: ['ambient', 'atmospheric', 'drone'],
      glitch: ['glitch', 'corrupted', 'broken'],
      vintage: ['vintage', 'retro', 'old', 'analog', 'vhs'],
      disturbing: ['disturbing', 'unsettling', 'nightmare'],
      electronic: ['electronic', 'synthesizer', 'digital'],
      'field-recording': ['field recording', 'found sound', 'environmental'],
      'lo-fi': ['lo-fi', 'low-fi', 'lofi'],
      static: ['static', 'noise', 'white noise'],
      nostalgic: ['nostalgic', 'memories', 'childhood'],
      eerie: ['eerie', 'spooky', 'creepy', 'scary'],
      mysterious: ['mysterious', 'mystery', 'unknown', 'hidden']
    };

    Object.entries(tagCategories).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    });

    // Add some randomness for diversity
    const additionalTags = ['weird', 'strange', 'unusual', 'odd'];
    if (Math.random() < 0.3) {
      const randomTag = additionalTags[Math.floor(Math.random() * additionalTags.length)];
      if (!tags.includes(randomTag)) {
        tags.push(randomTag);
      }
    }

    return tags.slice(0, 10); // Limit to 10 tags
  }

  getWeirdQueries(): string[] {
    return [
      'cursed audio',
      'liminal sounds',
      'backrooms audio',
      'nightmare fuel sounds',
      'disturbing audio',
      'weird experimental music',
      'analog horror sounds',
      'vhs glitch audio',
      'found tape recordings',
      'strange ambient sounds',
      'creepy vintage audio',
      'forbidden music',
      'lost media audio',
      'urban exploration sounds',
      'abandoned place audio'
    ];
  }
}