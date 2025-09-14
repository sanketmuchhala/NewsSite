import { Sound } from '@/types';
import axios from 'axios';

interface ArchiveSearchResult {
  identifier: string;
  title: string;
  description?: string;
  creator?: string;
  date: string;
  subject?: string[];
  collection?: string[];
  mediatype: string;
  format?: string[];
}

interface ArchiveFile {
  name: string;
  format: string;
  size: string;
  length?: string; // Duration for audio files
}

export class ArchiveScraper {
  private baseUrl: string = 'https://archive.org';
  private apiUrl: string = 'https://archive.org/advancedsearch.php';

  async searchWeirdSounds(query: string, maxResults: number = 20): Promise<Omit<Sound, 'id' | 'created_at'>[]> {
    try {
      const searchParams = {
        q: `${query} AND mediatype:audio`,
        fl: 'identifier,title,description,creator,date,subject,collection,format',
        sort: 'random',
        rows: maxResults.toString(),
        output: 'json'
      };

      const searchUrl = `${this.apiUrl}?${new URLSearchParams(searchParams)}`;
      const response = await axios.get(searchUrl);

      if (!response.data?.response?.docs) {
        throw new Error('No search results found');
      }

      const sounds: Omit<Sound, 'id' | 'created_at'>[] = [];

      for (const doc of response.data.response.docs) {
        try {
          const sound = await this.transformArchiveToSound(doc);
          if (sound) {
            sounds.push(sound);
          }
        } catch (error) {
          console.warn(`Failed to process archive item ${doc.identifier}:`, error);
        }
      }

      return sounds;
    } catch (error) {
      console.error('Archive.org scraping error:', error);
      throw error;
    }
  }

  private async transformArchiveToSound(doc: ArchiveSearchResult): Promise<Omit<Sound, 'id' | 'created_at'> | null> {
    try {
      // Get file details for the item
      const files = await this.getItemFiles(doc.identifier);
      const audioFile = this.findBestAudioFile(files);

      if (!audioFile) {
        return null;
      }

      const weirdnessScore = this.calculateWeirdnessScore(doc);
      const tags = this.extractTags(doc);

      return {
        title: doc.title,
        source_url: `${this.baseUrl}/download/${doc.identifier}/${audioFile.name}`,
        source_type: 'archive',
        duration: this.parseDuration(audioFile.length),
        tags: tags,
        description: this.cleanDescription(doc.description),
        thumbnail_url: `${this.baseUrl}/services/img/${doc.identifier}`,
        metadata: {
          archive_id: doc.identifier,
          author: doc.creator,
          license: 'Public Domain', // Most Archive.org content is public domain
        },
        weirdness_score: weirdnessScore,
      };
    } catch (error) {
      console.error('Error transforming Archive item:', error);
      return null;
    }
  }

  private async getItemFiles(identifier: string): Promise<ArchiveFile[]> {
    try {
      const filesUrl = `${this.baseUrl}/metadata/${identifier}/files`;
      const response = await axios.get(filesUrl);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get files for ${identifier}:`, error);
      return [];
    }
  }

  private findBestAudioFile(files: ArchiveFile[]): ArchiveFile | null {
    // Prefer common audio formats, avoid huge files
    const audioFormats = ['mp3', 'ogg', 'flac', 'wav', 'aiff'];
    const maxSize = 50 * 1024 * 1024; // 50MB max

    const audioFiles = files.filter(file => {
      const format = file.format?.toLowerCase();
      const size = this.parseSize(file.size);
      return audioFormats.includes(format || '') && size < maxSize;
    });

    if (audioFiles.length === 0) {
      return null;
    }

    // Prefer MP3 and OGG for web compatibility
    const webFormats = audioFiles.filter(file =>
      ['mp3', 'ogg'].includes(file.format?.toLowerCase() || '')
    );

    if (webFormats.length > 0) {
      // Return smallest web-compatible file
      return webFormats.reduce((smallest, current) =>
        this.parseSize(smallest.size) < this.parseSize(current.size) ? smallest : current
      );
    }

    // Return smallest audio file
    return audioFiles.reduce((smallest, current) =>
      this.parseSize(smallest.size) < this.parseSize(current.size) ? smallest : current
    );
  }

  private parseSize(sizeString: string): number {
    if (!sizeString) return 0;

    const units: Record<string, number> = {
      B: 1,
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024
    };

    const match = sizeString.match(/^([\d.]+)([BKMG])?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || 'B';
    return value * (units[unit] || 1);
  }

  private parseDuration(durationString?: string): number {
    if (!durationString) return 0;

    // Try to parse various duration formats
    // Format: "HH:MM:SS" or "MM:SS" or seconds
    if (durationString.includes(':')) {
      const parts = durationString.split(':').map(p => parseInt(p) || 0);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
    }

    // Try to parse as seconds
    const seconds = parseFloat(durationString);
    return isNaN(seconds) ? 0 : Math.round(seconds);
  }

  private calculateWeirdnessScore(doc: ArchiveSearchResult): number {
    let score = 6; // Archive.org content tends to be inherently weird/vintage

    const text = (
      doc.title + ' ' +
      (doc.description || '') + ' ' +
      (doc.subject?.join(' ') || '') + ' ' +
      (doc.collection?.join(' ') || '')
    ).toLowerCase();

    // Vintage and historical content is inherently weird
    const vintageKeywords = [
      'vintage', 'historical', 'old', 'antique', 'classic',
      '1920', '1930', '1940', '1950', '1960', '1970', '1980',
      'radio', 'broadcast', 'recording', 'phonograph', 'gramophone'
    ];

    vintageKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.3;
      }
    });

    // Weird content keywords
    const weirdKeywords = [
      'strange', 'unusual', 'bizarre', 'odd', 'experimental',
      'found', 'lost', 'rare', 'unknown', 'mystery',
      'field recording', 'ambient', 'noise', 'drone',
      'spoken word', 'interview', 'documentary',
      'public domain', 'archive', 'collection'
    ];

    weirdKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.2;
      }
    });

    // Certain collections are known for weird content
    const weirdCollections = [
      'prelinger', 'internetarchivebooks', 'opensource_audio',
      'community_media', 'radio_programs', 'spoken_word'
    ];

    doc.collection?.forEach(collection => {
      if (weirdCollections.includes(collection.toLowerCase())) {
        score += 0.5;
      }
    });

    // Very old dates increase weirdness
    const year = this.extractYear(doc.date);
    if (year && year < 1960) {
      score += 1;
    } else if (year && year < 1980) {
      score += 0.5;
    }

    return Math.min(Math.max(score, 1), 10);
  }

  private extractYear(dateString: string): number | null {
    if (!dateString) return null;

    const yearMatch = dateString.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }

  private extractTags(doc: ArchiveSearchResult): string[] {
    const tags: string[] = [];

    // Add subjects as tags
    if (doc.subject) {
      doc.subject.forEach(subject => {
        const cleanSubject = subject.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        if (cleanSubject && cleanSubject.length <= 20) {
          tags.push(cleanSubject);
        }
      });
    }

    // Add collection-based tags
    if (doc.collection) {
      doc.collection.forEach(collection => {
        const cleanCollection = collection.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        if (cleanCollection && cleanCollection.length <= 20) {
          tags.push(cleanCollection);
        }
      });
    }

    // Add vintage tag based on date
    const year = this.extractYear(doc.date);
    if (year) {
      if (year < 1950) tags.push('vintage');
      if (year < 1970) tags.push('retro');
      if (year < 1990) tags.push('classic');

      // Decade tags
      const decade = Math.floor(year / 10) * 10;
      tags.push(`${decade}s`);
    }

    // Add format-based tags
    if (doc.format) {
      doc.format.forEach(format => {
        const formatTag = format.toLowerCase();
        if (['radio', 'speech', 'music', 'sound'].includes(formatTag)) {
          tags.push(formatTag);
        }
      });
    }

    // Add general Archive.org tags
    tags.push('archive', 'historical', 'public-domain');

    return Array.from(new Set(tags)).slice(0, 12); // Remove duplicates and limit
  }

  private cleanDescription(description?: string): string | undefined {
    if (!description) return undefined;

    // Clean up common Archive.org metadata cruft
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
      .slice(0, 500) // Limit length
      .trim();
  }

  getWeirdQueries(): string[] {
    return [
      'field recording',
      'experimental music',
      'spoken word',
      'radio broadcast',
      'vintage recording',
      'old phonograph',
      'strange sounds',
      'ambient noise',
      'historical audio',
      'found sound',
      'audio documentary',
      'vintage radio',
      'old interview',
      'rare recording',
      'archival audio'
    ];
  }

  async getItemByIdentifier(identifier: string): Promise<Omit<Sound, 'id' | 'created_at'> | null> {
    try {
      const metadataUrl = `${this.baseUrl}/metadata/${identifier}`;
      const response = await axios.get(metadataUrl);

      if (!response.data?.metadata) {
        throw new Error('Item not found');
      }

      const doc: ArchiveSearchResult = {
        identifier,
        title: response.data.metadata.title || identifier,
        description: response.data.metadata.description,
        creator: response.data.metadata.creator,
        date: response.data.metadata.date || '',
        subject: response.data.metadata.subject,
        collection: response.data.metadata.collection,
        mediatype: response.data.metadata.mediatype || 'audio',
        format: response.data.metadata.format
      };

      return this.transformArchiveToSound(doc);
    } catch (error) {
      console.error('Archive item fetch error:', error);
      return null;
    }
  }
}