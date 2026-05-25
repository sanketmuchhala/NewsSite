import { NewsStory } from '../types';

/** Stub — Twitter API requires paid access. Returns empty array until credentials are added. */
export class TwitterScraper {
  constructor(
    private apiKey?: string,
    private apiSecret?: string,
  ) {}

  getTrendingHashtags(): string[] {
    return ['#WeirdNews', '#FloridaMan'];
  }

  async searchByHashtag(_tag: string, _limit: number): Promise<NewsStory[]> {
    return [];
  }
}
