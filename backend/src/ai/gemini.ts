interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateNewsStoryAnalysis(
    title: string,
    source: string,
    tags: string[],
    articleContent?: string,
  ): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const contentSection = articleContent
        ? `\n\nArticle content:\n${articleContent.slice(0, 2500)}`
        : '';

      const prompt = `You are a sharp, deadpan news writer for a funny news aggregator. Your job is to write a summary that both INFORMS and ENTERTAINS — someone who reads only your summary should fully understand what happened AND get a genuine chuckle out of it.

Rules:
- Write 5–7 sentences of flowing prose. No bullet points, no headers, no emojis.
- Stick 100% to the real facts from the article. Do not invent details, quotes, or outcomes.
- Preserve the full arc: who did what, why, what went wrong (or absurdly right), and how it ended.
- The humor comes from precise word choice and dry observation — not exaggeration or fabrication. Let the absurdity of the real story speak for itself.
- If the story is genuinely funny, lean into it with deadpan wit. If it's weird, describe the weirdness vividly. If it's a tech story, highlight the irony. If it's satire, play it straight.
- Write at a level that makes the reader feel smart for appreciating the joke.
- Aim for 120–200 words.

Title: "${title}"
Source: ${source}${contentSection}

Write the summary now (prose only, no preamble):`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 700,
          },
        }),
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

      const data = await response.json() as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text?.trim() || null;
    } catch (error) {
      console.error('Gemini generateNewsStoryAnalysis error:', error);
      return null;
    }
  }

  async categorizeNewsStory(title: string, source: string, summary?: string): Promise<string[]> {
    if (!this.apiKey) return [];

    try {
      const prompt = `Analyze this news story and suggest 3-5 relevant tags from this list: politics, tech, science, entertainment, sports, business, weird, absurd, florida-man, celebrity, scandal, viral, trending, breaking, investigative, opinion, satire, humor, bizarre, wtf, weed, cannabis, animals, crime, law.

Title: "${title}"
Source: "${source}"
${summary ? `Summary: "${summary}"` : ''}

Return only the tags as a comma-separated list, no explanations.`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 100 },
        }),
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

      const data = await response.json() as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Gemini categorizeNewsStory error:', error);
      return [];
    }
  }

  async calculateFunnyScore(
    title: string,
    source: string,
    summary?: string,
    tags?: string[],
  ): Promise<number> {
    if (!this.apiKey) return 50;

    try {
      const prompt = `Rate how "funny" or absurd this news story is on a scale of 1-100:
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 10 },
        }),
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

      const data = await response.json() as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const score = parseFloat(text.trim());
        if (!isNaN(score) && score >= 1 && score <= 100) return score;
      }
      return 50;
    } catch (error) {
      console.error('Gemini calculateFunnyScore error:', error);
      return 50;
    }
  }
}

export const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY || '');
