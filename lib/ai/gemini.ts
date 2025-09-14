interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSoundDescription(title: string, tags: string[]): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('Gemini API key not available');
      return null;
    }

    try {
      const prompt = `Write a creative and intriguing description (2-3 sentences max) for a weird sound called "${title}" with these tags: ${tags.join(', ')}. Make it mysterious and appealing to someone who enjoys strange, experimental, or liminal audio experiences. Focus on the mood and atmosphere it creates.`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0]?.text;
        return text?.trim() || null;
      }

      return null;
    } catch (error) {
      console.error('Error generating description with Gemini:', error);
      return null;
    }
  }

  async categorizeSound(title: string, description?: string): Promise<string[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const prompt = `Analyze this sound and suggest 3-5 relevant tags from this list: cursed, liminal, experimental, glitch, ambient, nightmare, vintage, electronic, field-recording, lo-fi, disturbing, nostalgic, abstract, drone, static, eerie, industrial, mysterious, analog, digital.

Sound: "${title}"
${description ? `Description: "${description}"` : ''}

Return only the tags as a comma-separated list, no explanations.`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 100,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0]?.text;
        if (text) {
          return text.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
        }
      }

      return [];
    } catch (error) {
      console.error('Error categorizing sound with Gemini:', error);
      return [];
    }
  }

  async calculateWeirdnessScore(title: string, description?: string, tags?: string[]): Promise<number> {
    if (!this.apiKey) {
      return 5.0; // Default score
    }

    try {
      const prompt = `Rate the "weirdness" of this sound on a scale of 1-10, where:
1-3 = Normal/conventional sounds
4-6 = Somewhat unusual or quirky
7-8 = Definitely weird/strange
9-10 = Extremely bizarre/cursed/unsettling

Sound: "${title}"
${description ? `Description: "${description}"` : ''}
${tags ? `Tags: ${tags.join(', ')}` : ''}

Return only a single number between 1-10, no explanations.`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 10,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0]?.text;
        if (text) {
          const score = parseFloat(text.trim());
          if (!isNaN(score) && score >= 1 && score <= 10) {
            return score;
          }
        }
      }

      return 5.0; // Default fallback
    } catch (error) {
      console.error('Error calculating weirdness score with Gemini:', error);
      return 5.0;
    }
  }
}

// Export a singleton instance
export const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY || '');