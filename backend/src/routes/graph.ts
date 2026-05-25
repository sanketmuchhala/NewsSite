import { Router, Request, Response } from 'express';
import { adminGetStories } from '../firebase/firestore-admin';
import { NewsStory } from '../types';

const router = Router();

// GET /api/graph
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await adminGetStories(100, 'scraped_at');
    if (!result.success || !result.data) {
      return res.status(500).json({ error: result.error || 'Failed to fetch stories' });
    }

    const stories = result.data;

    const nodes = stories.map(story => ({
      id: story.slug ?? story.url,
      label: story.title.length > 30 ? story.title.slice(0, 30) + '…' : story.title,
      title: `${story.title}\nFunny Score: ${story.funny_score ?? 0}/100\nSource: ${story.source}`,
      color: nodeColor(story.source_type || 'rss', story.funny_score ?? 50),
      size: Math.max(15, Math.min(30, (story.funny_score ?? 50) * 0.3)),
      font: { size: 12 },
      story,
    }));

    const edges = computeRelationships(stories).map(rel => ({
      from: rel.from,
      to: rel.to,
      label: rel.type,
      color: edgeColor(rel.type),
      width: Math.max(1, rel.strength * 3),
    }));

    return res.json({ success: true, data: { nodes, edges } });
  } catch (error) {
    console.error('Graph API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function computeRelationships(stories: NewsStory[]) {
  const edges: { from: unknown; to: unknown; type: string; strength: number }[] = [];
  for (let i = 0; i < stories.length; i++) {
    for (let j = i + 1; j < stories.length; j++) {
      const a = stories[i];
      const b = stories[j];
      const idA = a.slug ?? a.url;
      const idB = b.slug ?? b.url;
      if (!idA || !idB) continue;

      let strength = 0;
      const sharedTags = (a.tags || []).filter(t => (b.tags || []).includes(t));
      strength += sharedTags.length * 0.2;
      if (a.source === b.source) strength += 0.3;
      const wordsA = a.title.toLowerCase().split(/\s+/);
      const wordsB = b.title.toLowerCase().split(/\s+/);
      strength += wordsA.filter(w => w.length > 3 && wordsB.includes(w)).length * 0.1;

      if (strength > 0.3) {
        edges.push({
          from: idA,
          to: idB,
          type: strength > 0.7 ? 'similar' : a.source === b.source ? 'follow_up' : 'related',
          strength: Math.min(strength, 1),
        });
      }
    }
  }
  return edges;
}

function nodeColor(sourceType: string, funnyScore: number): string {
  const base: Record<string, string> = {
    reddit: '#FF4500', rss: '#FF6600', twitter: '#1DA1F2', api: '#9900CC',
  };
  const hex = base[sourceType] || '#666666';
  const intensity = Math.max(0.6, funnyScore / 100);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const bv = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${bv},${intensity})`;
}

function edgeColor(type: string): string {
  const colors: Record<string, string> = {
    similar: '#10B981', related: '#06B6D4', follow_up: '#8B5CF6',
  };
  return colors[type] || '#666666';
}

export default router;
