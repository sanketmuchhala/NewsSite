// Shared article text extraction utilities

export async function fetchArticleText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FunnyNewsBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Strip chrome elements
    let stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<(nav|header|footer|aside|figure|figcaption|form|button)[^>]*>[\s\S]*?<\/\1>/gi, '');

    // Try to find the main article body first
    const bodyPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
      /<div[^>]*(?:class|id)=["'][^"']*(?:post-content|article-body|entry-content|story-body|content-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    let body = '';
    for (const pattern of bodyPatterns) {
      const m = stripped.match(pattern);
      if (m?.[1]) { body = m[1]; break; }
    }
    if (!body) body = stripped;

    const cleaned = body
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (cleaned.length > 150) {
      return cleaned.slice(0, 3000);
    }

    // Fallback: grab meta description (useful for SPAs / JS-rendered pages)
    const metaDesc =
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{30,})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{30,})["'][^>]+name=["']description["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{30,})["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']{30,})["'][^>]+property=["']og:description["']/i)?.[1];

    return metaDesc?.trim() ?? null;
  } catch {
    return null;
  }
}

export function extractReadableSummary(text: string, title: string): string {
  // Skip to first sentence boundary after 100 chars to avoid page title/breadcrumb remnants
  let body = text;
  if (text.length > 300) {
    const sentenceStart = text.slice(100).search(/(?<=[.!?])\s+[A-Z]/);
    body = sentenceStart >= 0 ? text.slice(100 + sentenceStart).trimStart() : text.slice(150);
  }

  const junkPattern = /cookie|javascript|©|all rights reserved|skip to|privacy policy|subscribe|newsletter|sign up|log in|sign in/i;

  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    // length between 80 and 600 chars
    .filter(s => s.length >= 80 && s.length <= 600)
    // mostly lower-case (real prose, not NAV ITEMS IN CAPS)
    .filter(s => (s.match(/[a-z]/g) ?? []).length > s.length * 0.35)
    // no emoji UI patterns
    .filter(s => !/[\u{1F300}-\u{1FAFF}]/u.test(s))
    // no boilerplate
    .filter(s => !junkPattern.test(s))
    // doesn't start with the page title
    .filter(s => !s.toLowerCase().startsWith(title.toLowerCase().slice(0, 30)));

  if (sentences.length === 0) {
    // Last-resort: take first 350 non-title chars
    const trimmed = body.replace(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
    return trimmed.slice(0, 350).replace(/\s+\S*$/, '') + '...';
  }

  // Return up to 3 good sentences (~300-500 chars), normalise internal whitespace
  let result = '';
  for (const s of sentences) {
    result += (result ? ' ' : '') + s;
    if (result.length >= 280) break;
  }
  return result.replace(/\s+/g, ' ').trim();
}
