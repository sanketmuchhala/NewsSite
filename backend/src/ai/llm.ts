/**
 * LLMClient — Groq primary (free tier), Gemini fallback.
 *
 * Groq offers Llama 3.3 70B on a generous free tier and returns responses
 * ~5× faster than Gemini for the same quality. We fall back to Gemini
 * automatically when Groq is unavailable or the API key is missing.
 */

import Groq from 'groq-sdk';
import { geminiClient } from './gemini';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export class LLMClient {
  private groq: Groq | null;

  constructor() {
    const key = process.env.GROQ_API_KEY;
    this.groq = key ? new Groq({ apiKey: key }) : null;
    if (!key) console.warn('[LLM] GROQ_API_KEY not set — using Gemini only');
  }

  // ── Private: call Groq chat completion ─────────────────────────────────────

  private async groqChat(
    prompt: string,
    opts: { temperature?: number; maxTokens?: number } = {},
  ): Promise<string | null> {
    if (!this.groq) return null;
    try {
      const completion = await this.groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 512,
      });
      return completion.choices[0]?.message?.content?.trim() ?? null;
    } catch (err) {
      console.warn('[LLM] Groq error, will fall back to Gemini:', (err as Error).message?.slice(0, 80));
      return null;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Generate a deadpan, 5–7 sentence satirical summary of an article.
   * ai_model field returned so callers can record which model was used.
   */
  async generateSummary(
    title: string,
    source: string,
    tags: string[],
    content: string,
  ): Promise<{ text: string | null; model: string }> {
    const prompt = `You are a sharp, deadpan news writer for a funny news aggregator. Write a summary that INFORMS and ENTERTAINS.

Rules:
- Write 5–7 sentences of flowing prose. No bullet points, no headers, no emojis.
- Stick 100% to the real facts. Do not invent details or quotes.
- The humor comes from precise word choice and dry observation — not exaggeration.
- Aim for 120–200 words.

Title: "${title}"
Source: ${source}${content ? `\n\nArticle content:\n${content.slice(0, 2500)}` : ''}

Write the summary now (prose only, no preamble):`;

    const groqText = await this.groqChat(prompt, { temperature: 0.8, maxTokens: 700 });
    if (groqText) return { text: groqText, model: `groq/${GROQ_MODEL}` };

    // Gemini fallback
    const geminiText = await geminiClient.generateNewsStoryAnalysis(title, source, tags, content);
    return { text: geminiText, model: 'gemini-2.0-flash' };
  }

  /**
   * Return 3–5 lowercase tag strings relevant to this story.
   */
  async generateTags(title: string, source: string, content?: string): Promise<string[]> {
    const prompt = `Suggest 3-5 tags for this news story from this list: politics, tech, science, entertainment, sports, business, weird, absurd, florida-man, celebrity, scandal, viral, trending, satire, humor, bizarre, wtf, weed, cannabis, animals, crime, law.

Title: "${title}"
Source: "${source}"
${content ? `Content: "${content.slice(0, 500)}"` : ''}

Return only a comma-separated list of tags, nothing else.`;

    const groqText = await this.groqChat(prompt, { temperature: 0.3, maxTokens: 60 });
    if (groqText) {
      return groqText.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }
    return geminiClient.categorizeNewsStory(title, source, content);
  }

  /**
   * Rate funniness/absurdity 1–100.
   */
  async calculateFunnyScore(
    title: string,
    source: string,
    content?: string,
    tags?: string[],
  ): Promise<number> {
    const prompt = `Rate the funniness/absurdity of this news story 1-100:
1-25 = Regular news
26-50 = Mildly amusing
51-75 = Pretty funny/bizarre
76-100 = Hilariously absurd

Title: "${title}"
Source: "${source}"
${content ? `Content: "${content.slice(0, 400)}"` : ''}
${tags?.length ? `Tags: ${tags.join(', ')}` : ''}

Return only a single integer 1-100, nothing else.`;

    const groqText = await this.groqChat(prompt, { temperature: 0.2, maxTokens: 6 });
    if (groqText) {
      const score = parseInt(groqText.trim(), 10);
      if (!isNaN(score) && score >= 1 && score <= 100) return score;
    }
    return geminiClient.calculateFunnyScore(title, source, content, tags);
  }
}

export const llmClient = new LLMClient();
