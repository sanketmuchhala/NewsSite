import { Sound } from '@/types';

interface FreesoundSearchResult {
  id: number;
  name: string;
  description: string;
  url: string;
  duration: number;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
  images: {
    waveform_m: string;
    spectral_m: string;
  };
  tags: string[];
  username: string;
  license: string;
  download_url: string;
  created: string;
}

export class FreesoundScraper {
  private apiKey: string;
  private baseUrl: string = 'https://freesound.org/apiv2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchWeirdSounds(query: string, maxResults: number = 20): Promise<Omit<Sound, 'id' | 'created_at'>[]> {
    try {
      const searchUrl = `${this.baseUrl}/search/text/?query=${encodeURIComponent(query)}&page_size=${maxResults}&fields=id,name,description,url,duration,previews,images,tags,username,license,download_url,created&token=${this.apiKey}`;

      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`Freesound API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results) {
        throw new Error('No search results found');
      }

      const sounds: Omit<Sound, 'id' | 'created_at'>[] = [];

      for (const item of data.results) {
        const sound = this.transformFreesoundToSound(item);
        if (sound) {
          sounds.push(sound);
        }
      }

      return sounds;
    } catch (error) {
      console.error('Freesound scraping error:', error);
      throw error;
    }
  }

  async getSoundById(soundId: number): Promise<Omit<Sound, 'id' | 'created_at'> | null> {
    try {
      const url = `${this.baseUrl}/sounds/${soundId}/?fields=id,name,description,url,duration,previews,images,tags,username,license,download_url,created&token=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Freesound API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformFreesoundToSound(data);
    } catch (error) {
      console.error('Freesound sound fetch error:', error);
      return null;
    }
  }

  private transformFreesoundToSound(item: FreesoundSearchResult): Omit<Sound, 'id' | 'created_at'> | null {
    try {
      const weirdnessScore = this.calculateWeirdnessScore(item);
      const enhancedTags = this.enhanceTags(item.tags, item.name, item.description);

      return {
        title: item.name,
        source_url: item.previews['preview-hq-mp3'] || item.previews['preview-lq-mp3'],
        source_type: 'freesound',
        duration: Math.round(item.duration),
        tags: enhancedTags,
        description: item.description || `Sound by ${item.username} on Freesound`,
        thumbnail_url: item.images?.spectral_m || item.images?.waveform_m,
        metadata: {
          freesound_id: item.id,
          author: item.username,
          license: item.license,
        },
        weirdness_score: weirdnessScore,
      };
    } catch (error) {
      console.error('Error transforming Freesound item:', error);
      return null;
    }
  }

  private calculateWeirdnessScore(item: FreesoundSearchResult): number {
    let score = 5; // Base score

    const text = (item.name + ' ' + item.description + ' ' + item.tags.join(' ')).toLowerCase();

    // Weird keywords increase score
    const weirdKeywords = [
      'strange', 'weird', 'bizarre', 'unusual', 'odd',
      'experimental', 'abstract', 'avant-garde',
      'glitch', 'corrupted', 'distorted', 'broken',
      'noise', 'static', 'interference',
      'ambient', 'drone', 'atmospheric',
      'eerie', 'creepy', 'spooky', 'haunting',
      'industrial', 'harsh', 'abrasive',
      'found', 'field-recording', 'environmental',
      'vintage', 'old', 'analog', 'tape',
      'feedback', 'resonance', 'reverb',
      'modular', 'synthesis', 'electronic'
    ];

    weirdKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.3;
      }
    });

    // Certain tags are particularly weird
    const superWeirdTags = [
      'glitch', 'noise', 'experimental', 'abstract',
      'industrial', 'harsh', 'feedback', 'distortion',
      'strange', 'weird', 'unusual', 'bizarre'
    ];

    item.tags.forEach(tag => {
      if (superWeirdTags.includes(tag.toLowerCase())) {
        score += 0.5;
      }
    });

    // Very long or very short sounds might be weird
    if (item.duration < 5 || item.duration > 300) {
      score += 0.5;
    }

    // Uncommon file formats or strange metadata
    if (text.includes('8bit') || text.includes('lo-fi') || text.includes('degraded')) {
      score += 0.5;
    }

    return Math.min(Math.max(score, 1), 10);
  }

  private enhanceTags(originalTags: string[], name: string, description: string): string[] {
    const tags = [...originalTags];
    const text = (name + ' ' + description).toLowerCase();

    // Map common Freesound tags to our weird categories
    const tagMappings: Record<string, string[]> = {
      experimental: ['experimental', 'avant-garde', 'abstract'],
      glitch: ['glitch', 'glitchy', 'corrupted', 'broken', 'error'],
      ambient: ['ambient', 'atmospheric', 'drone', 'pad'],
      'field-recording': ['field-recording', 'environmental', 'found'],
      electronic: ['electronic', 'synth', 'digital', 'computer'],
      'lo-fi': ['lo-fi', 'degraded', '8bit', 'vintage'],
      noise: ['noise', 'static', 'white-noise', 'pink-noise'],
      disturbing: ['disturbing', 'uncomfortable', 'tension'],
      industrial: ['industrial', 'mechanical', 'machine'],
      vintage: ['vintage', 'old', 'retro', 'analog']
    };

    // Add category tags based on existing tags
    Object.entries(tagMappings).forEach(([category, keywords]) => {
      if (keywords.some(keyword =>
        originalTags.some(tag => tag.toLowerCase().includes(keyword)) ||
        text.includes(keyword)
      )) {
        if (!tags.includes(category)) {
          tags.push(category);
        }
      }
    });

    // Add weirdness level tags
    const weirdnessScore = this.calculateWeirdnessScore({
      name,
      description,
      tags: originalTags,
      duration: 0,
      id: 0,
      url: '',
      previews: { 'preview-hq-mp3': '', 'preview-lq-mp3': '' },
      images: { waveform_m: '', spectral_m: '' },
      username: '',
      license: '',
      download_url: '',
      created: ''
    });

    if (weirdnessScore >= 8) {
      if (!tags.includes('cursed')) tags.push('cursed');
    } else if (weirdnessScore >= 6) {
      if (!tags.includes('strange')) tags.push('strange');
    }

    return tags.slice(0, 15); // Limit to 15 tags
  }

  getWeirdQueries(): string[] {
    return [
      'experimental',
      'glitch',
      'noise',
      'abstract',
      'ambient weird',
      'industrial harsh',
      'field recording strange',
      'vintage corrupted',
      'feedback distortion',
      'lo-fi broken',
      'analog glitch',
      'drone eerie',
      'found sound',
      'environmental odd',
      'synthesis experimental'
    ];
  }

  async getRandomWeirdSounds(count: number = 10): Promise<Omit<Sound, 'id' | 'created_at'>[]> {
    const queries = this.getWeirdQueries();
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    try {
      const sounds = await this.searchWeirdSounds(randomQuery, count);
      // Shuffle and return random selection
      return sounds.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Random weird sounds fetch error:', error);
      return [];
    }
  }

  async searchByTags(tags: string[], maxResults: number = 20): Promise<Omit<Sound, 'id' | 'created_at'>[]> {
    const tagQuery = tags.join(' OR ');
    return this.searchWeirdSounds(tagQuery, maxResults);
  }
}