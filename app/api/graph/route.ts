import { NextResponse } from 'next/server';
import { adminGetStories, adminGetRelationships } from '@/lib/firebase/firestore-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [storiesResult, relResult] = await Promise.all([
      adminGetStories(150, 'scraped_at'),
      adminGetRelationships(500),
    ]);

    if (!storiesResult.success || !storiesResult.data) {
      return NextResponse.json({ error: storiesResult.error || 'Failed to fetch stories' }, { status: 500 });
    }

    const stories = storiesResult.data;
    const relationships = relResult.data ?? [];

    const slugSet = new Set(stories.map(s => s.slug));

    const nodes = stories.map(story => ({
      id: story.slug,
      label: story.title.length > 30 ? story.title.slice(0, 30) + '...' : story.title,
      title: `${story.title}\nFunny Score: ${story.funny_score}/100\nSource: ${story.source}`,
      color: getNodeColor(story.source_type || 'rss', story.funny_score ?? 50),
      size: Math.max(15, Math.min(30, (story.funny_score ?? 50) * 0.3)),
      font: { size: 12 },
      story,
    }));

    const edges = relationships
      .filter(r => slugSet.has(r.source_id) && slugSet.has(r.target_id))
      .map(r => ({
        from:  r.source_id,
        to:    r.target_id,
        label: r.relationship_type,
        color: getEdgeColor(r.relationship_type),
        width: Math.max(1, r.strength * 3),
        font:  { size: 10 },
      }));

    return NextResponse.json({ success: true, data: { nodes, edges } });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNodeColor(sourceType: string, funnyScore: number): string {
  const base: Record<string, string> = {
    reddit: '#FF4500', rss: '#FF6600', hackernews: '#9900CC', api: '#9900CC', manual: '#666666',
  };
  const hex = base[sourceType] || '#666666';
  const intensity = Math.max(0.6, funnyScore / 100);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const bv = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${bv},${intensity})`;
}

function getEdgeColor(type: string): string {
  const colors: Record<string, string> = {
    similar: '#10B981', related: '#06B6D4', follow_up: '#8B5CF6', contradicts: '#EF4444', updates: '#F59E0B',
  };
  return colors[type] || '#666666';
}
