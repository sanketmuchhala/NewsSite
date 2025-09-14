import { NextResponse } from 'next/server';
import { getGraphData } from '@/lib/db';
import { GraphData, GraphNode, GraphEdge } from '@/types';

export async function GET() {
  try {
    const result = await getGraphData();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch graph data' },
        { status: 500 }
      );
    }

    const { sounds, relationships } = result.data;

    // Transform data for vis-network
    const nodes: GraphNode[] = sounds.map(sound => ({
      id: sound.id,
      label: sound.title.length > 30 ? sound.title.substring(0, 30) + '...' : sound.title,
      title: `${sound.title}\nWeirdness: ${sound.weirdness_score}/10\nTags: ${sound.tags.join(', ')}`,
      color: getNodeColor(sound.source_type, sound.weirdness_score),
      size: Math.max(10, sound.weirdness_score * 3),
      sound
    }));

    const edges: GraphEdge[] = relationships.map(rel => ({
      from: rel.sound_id_1,
      to: rel.sound_id_2,
      label: rel.relationship_type,
      color: getEdgeColor(rel.relationship_type),
      width: Math.max(1, rel.strength / 2),
      relationship: rel
    }));

    const graphData: GraphData = { nodes, edges };

    return NextResponse.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getNodeColor(sourceType: string, weirdnessScore: number): string {
  const baseColors = {
    youtube: '#FF0000',
    freesound: '#FF6600',
    archive: '#9900CC'
  };

  // Adjust opacity based on weirdness score
  const opacity = Math.max(0.6, weirdnessScore / 10);
  const color = baseColors[sourceType as keyof typeof baseColors] || '#666666';

  return color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
}

function getEdgeColor(relationshipType: string): string {
  const colors = {
    similar: '#10B981',
    tag_match: '#06B6D4',
    sequence: '#8B5CF6',
    remix: '#EC4899'
  };

  return colors[relationshipType as keyof typeof colors] || '#666666';
}