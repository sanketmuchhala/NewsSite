import { NextResponse } from 'next/server';
import { getGraphData } from '@/lib/db';

export async function GET() {
  console.log('Graph API called');
  try {
    console.log('Getting graph data...');
    const result = await getGraphData();
    console.log('Graph data result:', result);

    if (!result.success || !result.data) {
      console.log('Graph data fetch failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to fetch graph data' },
        { status: 500 }
      );
    }

    const { stories, relationships } = result.data;
    console.log('Stories count:', stories.length, 'Relationships count:', relationships.length);

    // Transform data for vis-network
    const nodes = stories.map(story => ({
      id: story.id,
      label: story.title.length > 30 ? story.title.substring(0, 30) + '...' : story.title,
      title: `${story.title}\nFunny Score: ${story.funny_score || 0}/100\nTags: ${(story.tags || []).join(', ')}\nSource: ${story.source}`,
      color: getNodeColor(story.source_type || 'rss', story.funny_score || 50),
      size: Math.max(15, Math.min(30, (story.funny_score || 50) * 0.3)),
      font: { size: 12 },
      story
    }));

    const edges = relationships.map(rel => ({
      from: rel.source_id,
      to: rel.target_id,
      label: rel.relationship_type,
      color: getEdgeColor(rel.relationship_type),
      width: Math.max(1, (rel.strength || 0.5) * 3),
      font: { size: 10 },
      relationship: rel
    }));

    const graphData = { nodes, edges };
    console.log('Sending graph data:', { nodeCount: nodes.length, edgeCount: edges.length });

    return NextResponse.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getNodeColor(sourceType: string, funnyScore: number): string {
  const baseColors = {
    reddit: '#FF4500',
    rss: '#FF6600', 
    twitter: '#1DA1F2',
    api: '#9900CC'
  };

  // Adjust intensity based on funny score
  const intensity = Math.max(0.6, funnyScore / 100);
  const color = baseColors[sourceType as keyof typeof baseColors] || '#666666';
  
  // Convert hex to RGB and apply intensity
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${intensity})`;
}

function getEdgeColor(relationshipType: string): string {
  const colors = {
    similar: '#10B981',
    related: '#06B6D4',
    follow_up: '#8B5CF6',
    contradicts: '#EC4899',
    updates: '#F59E0B'
  };

  return colors[relationshipType as keyof typeof colors] || '#666666';
}