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

  async generateNewsStoryAnalysis(title: string, source: string, tags: string[]): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('Gemini API key not available');
      return null;
    }

    try {
      const prompt = `Write a witty and engaging analysis (2-3 sentences max) for this news story: "${title}" from ${source} with these tags: ${tags.join(', ')}. Make it humorous and appealing to someone who enjoys absurd, satirical, or bizarre news. Focus on what makes this story funny or interesting.`;

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
      console.error('Error generating news story analysis with Gemini:', error);
      return null;
    }
  }

  async categorizeNewsStory(title: string, source: string, summary?: string): Promise<string[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const prompt = `Analyze this news story and suggest 3-5 relevant tags from this list: politics, tech, science, entertainment, sports, business, weird, absurd, florida-man, celebrity, scandal, viral, trending, breaking, investigative, opinion, satire, humor, bizarre, wtf.

Title: "${title}"
Source: "${source}"
${summary ? `Summary: "${summary}"` : ''}

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
      console.error('Error categorizing news story with Gemini:', error);
      return [];
    }
  }

  async calculateFunnyScore(title: string, source: string, summary?: string, tags?: string[]): Promise<number> {
    if (!this.apiKey) {
      return 50.0; // Default score
    }

    try {
      const prompt = `Rate how "funny" or absurd this news story is on a scale of 1-100, where:
1-25 = Regular news, not particularly funny
26-50 = Mildly amusing or ironic
51-75 = Pretty funny/absurd/bizarre
76-100 = Hilariously absurd/peak internet content

Title: "${title}"
Source: "${source}"
${summary ? `Summary: "${summary}"` : ''}
${tags ? `Tags: ${tags.join(', ')}` : ''}

Return only a single number between 1-100, no explanations.`;

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
          if (!isNaN(score) && score >= 1 && score <= 100) {
            return score;
          }
        }
      }

      return 50.0; // Default fallback
    } catch (error) {
      console.error('Error calculating funny score with Gemini:', error);
      return 50.0;
    }
  }
}

// Export a singleton instance
export const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY || '');