'use client';

import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { GraphData, GraphNode, GraphEdge, NewsStory } from '@/types';
import { X, ExternalLink } from 'lucide-react';

interface NetworkGraphProps {
  onNodeClick?: (story: NewsStory) => void;
  className?: string;
}

export default function NetworkGraph({ onNodeClick, className = '' }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef   = useRef<Network | null>(null);
  const [graphData,    setGraphData]    = useState<GraphData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats,        setStats]        = useState({
    totalStories:  0,
    connections:   0,
    funniestStory: null as GraphNode | null,
  });

  // ─── Data fetching ──────────────────────────────────────────

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/graph');
      const result   = await response.json();
      if (result.success && result.data) {
        setGraphData(result.data);
        calculateStats(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load graph data');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Graph data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: GraphData) => {
    const funniestStory = data.nodes.reduce((prev: GraphNode, current: GraphNode) =>
      (current.story.funny_score || 0) > (prev.story.funny_score || 0) ? current : prev
    );
    setStats({ totalStories: data.nodes.length, connections: data.edges.length, funniestStory });
  };

  // ─── vis-network color helpers (unchanged) ──────────────────

  const getNodeBackgroundColor = (sourceType: string, funnyScore: number): string => {
    const colors = {
      reddit:  { r: 255, g: 69,  b: 0   },
      rss:     { r: 59,  g: 130, b: 246 },
      twitter: { r: 29,  g: 161, b: 242 },
      api:     { r: 147, g: 51,  b: 234 },
    };
    const color     = colors[sourceType as keyof typeof colors] || colors.rss;
    const intensity = Math.max(0.8, Math.min(1, funnyScore / 100));
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
  };

  const getNodeBorderColor = (sourceType: string): string => {
    const colors = { reddit: '#ff6b35', rss: '#60a5fa', twitter: '#38bdf8', api: '#a855f7' };
    return colors[sourceType as keyof typeof colors] || colors.rss;
  };

  const getNodeHighlightColor = (sourceType: string): string => {
    const colors = { reddit: '#ff8c42', rss: '#93c5fd', twitter: '#7dd3fc', api: '#c084fc' };
    return colors[sourceType as keyof typeof colors] || colors.rss;
  };

  const getEdgeColor = (relationshipType: string): string => {
    const colors = {
      similar:     '#10b981',
      related:     '#6b7280',
      follow_up:   '#8b5cf6',
      contradicts: '#ef4444',
      updates:     '#f59e0b',
    };
    return colors[relationshipType as keyof typeof colors] || colors.related;
  };

  const getEdgeHighlightColor = (relationshipType: string): string => {
    const colors = {
      similar:     '#34d399',
      related:     '#9ca3af',
      follow_up:   '#a78bfa',
      contradicts: '#f87171',
      updates:     '#fbbf24',
    };
    return colors[relationshipType as keyof typeof colors] || colors.related;
  };

  // ─── Network init (unchanged) ───────────────────────────────

  const initializeNetwork = () => {
    if (!containerRef.current || !graphData) return;

    const nodes = new DataSet(graphData.nodes.map((node: GraphNode) => ({
      id:    node.id,
      label: node.label,
      title: node.title,
      color: {
        background: getNodeBackgroundColor(node.story.source_type || 'rss', node.story.funny_score || 50),
        border:     getNodeBorderColor(node.story.source_type || 'rss'),
        highlight:  { background: getNodeHighlightColor(node.story.source_type || 'rss'), border: '#ffffff' },
        hover:      { background: getNodeHighlightColor(node.story.source_type || 'rss'), border: '#ffffff' },
      },
      size: Math.max(20, Math.min(50, (node.story.funny_score || 50) * 0.5)),
      font: {
        color:       '#ffffff',
        size:        13,
        face:        'Inter, system-ui, sans-serif',
        strokeWidth: 2,
        strokeColor: 'rgba(0, 0, 0, 0.8)',
      },
      borderWidth: 2,
      shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.3)', size: 8, x: 2, y: 2 },
      story: node.story,
    })));

    const edges = new DataSet(graphData.edges.map((edge: GraphEdge) => ({
      id:    `${edge.from}-${edge.to}`,
      from:  edge.from,
      to:    edge.to,
      label: edge.label,
      color: {
        color:     getEdgeColor(edge.relationship?.relationship_type || 'related'),
        highlight: getEdgeHighlightColor(edge.relationship?.relationship_type || 'related'),
        opacity:   0.7,
      },
      width: Math.max(2, Math.min(6, (edge.relationship?.strength || 0.5) * 8)),
      font: {
        color:       '#e5e7eb',
        size:        11,
        face:        'Inter, system-ui, sans-serif',
        strokeWidth: 3,
        strokeColor: '#1f2937',
        background:  'rgba(31, 41, 55, 0.8)',
      },
      smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 },
    })));

    const options: any = {
      nodes: {
        borderWidth:         3,
        borderWidthSelected: 4,
        font:   { color: '#ffffff', size: 13, face: 'Inter, system-ui, sans-serif', strokeWidth: 2, strokeColor: 'rgba(0, 0, 0, 0.8)' },
        shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.2)', size: 10, x: 2, y: 2 },
        scaling: { min: 20, max: 50, label: { enabled: true, min: 12, max: 16 } },
        shape: 'dot',
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.8, type: 'arrow' } },
        smooth: { enabled: true, type: 'curvedCW', roundness: 0.15 },
        shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.1)', size: 3 },
        font:   { color: '#e5e7eb', size: 11, face: 'Inter, system-ui, sans-serif', strokeWidth: 3, strokeColor: '#1f2937', background: 'rgba(31, 41, 55, 0.8)' },
        labelHighlightBold: false,
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 200, updateInterval: 25, onlyDynamicEdges: false, fit: true },
        barnesHut: {
          gravitationalConstant: -15000,
          centralGravity:  0.4,
          springLength:    150,
          springConstant:  0.08,
          damping:         0.15,
          avoidOverlap:    0.3,
        },
        maxVelocity: 30,
        minVelocity: 0.75,
        timestep:    0.3,
        adaptiveTimestep: true,
      },
      interaction: {
        dragNodes:            true,
        dragView:             true,
        zoomView:             true,
        selectConnectedEdges: true,
        hover:                true,
        hoverConnectedEdges:  true,
        tooltipDelay:         300,
        zoomSpeed:            1.2,
      },
      layout: { improvedLayout: true, clusterThreshold: 150, hierarchical: false },
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node   = graphData.nodes.find(n => n.id === nodeId);
        if (node) { setSelectedNode(node); onNodeClick?.(node.story); }
      } else {
        setSelectedNode(null);
      }
    });

    network.on('hoverNode', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'pointer';
    });

    network.on('blurNode', () => {
      if (containerRef.current) containerRef.current.style.cursor = 'default';
    });

    network.on('stabilizationIterationsDone', () => {
      network.setOptions({ physics: { enabled: false } });
      setTimeout(() => {
        network.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
      }, 100);
    });

    networkRef.current = network;
  };

  // ─── Effects ────────────────────────────────────────────────

  useEffect(() => { loadGraphData(); }, []);

  useEffect(() => {
    if (graphData && !loading) initializeNetwork();
    return () => { if (networkRef.current) { networkRef.current.destroy(); networkRef.current = null; } };
  }, [graphData, loading]);

  // ─── Control handlers (unchanged) ──────────────────────────

  const handleFitNetwork = () => {
    networkRef.current?.fit({ animation: { duration: 1200, easingFunction: 'easeInOutCubic' } });
  };

  const handleRandomFocus = () => {
    if (networkRef.current && graphData?.nodes.length) {
      const node = graphData.nodes[Math.floor(Math.random() * graphData.nodes.length)];
      networkRef.current.focus(node.id, { scale: 1.8, animation: { duration: 1200, easingFunction: 'easeInOutCubic' } });
      setSelectedNode(node);
    }
  };

  const handleFunniestStory = () => {
    if (networkRef.current && stats.funniestStory) {
      networkRef.current.focus(stats.funniestStory.id, { scale: 2.2, animation: { duration: 1200, easingFunction: 'easeInOutCubic' } });
      setSelectedNode(stats.funniestStory);
    }
  };

  // ─── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-border/40 bg-[hsl(240,10%,4%)] ${className}`}
        style={{ minHeight: '75vh' }}
      >
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">Building Story Network</p>
            <p className="text-muted-foreground text-xs">Analyzing relationships between stories</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-border/40 bg-[hsl(240,10%,4%)] ${className}`}
        style={{ minHeight: '75vh' }}
      >
        <div className="text-center space-y-4 p-8 max-w-sm">
          <p className="font-mono text-2xl text-muted-foreground/30">!</p>
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">Network Unavailable</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{error}</p>
          </div>
          <button
            onClick={loadGraphData}
            className="px-5 py-2 rounded-lg bg-amber-400 text-zinc-950 text-sm font-bold hover:bg-amber-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Panel card shared style ─────────────────────────────────

  const panel = 'bg-background/85 backdrop-blur-md border border-border/50 rounded-xl';
  const panelLabel = 'text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-amber-400 mb-3 block';

  // ─── Main render ────────────────────────────────────────────

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-border/40 ${className}`}
      style={{ background: 'hsl(240,10%,4%)', minHeight: '75vh' }}
    >
      {/* Dot-grid overlay — matches site background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.025)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none z-0" />

      {/* ── Control panel — top left ──────────────────────────── */}
      <div className="absolute top-4 left-4 z-20">
        <div className={`${panel} p-3.5 min-w-[120px]`}>
          <span className={panelLabel}>Controls</span>
          <div className="space-y-2">
            <button
              onClick={handleFitNetwork}
              className="w-full px-3 py-2 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition-colors"
            >
              Fit View
            </button>
            <button
              onClick={handleRandomFocus}
              className="w-full px-3 py-2 rounded-lg border border-border/50 text-foreground text-xs font-medium hover:border-amber-400/40 hover:text-amber-400 transition-colors"
            >
              Random
            </button>
            {stats.funniestStory && (
              <button
                onClick={handleFunniestStory}
                className="w-full px-3 py-2 rounded-lg border border-border/50 text-foreground text-xs font-medium hover:border-amber-400/40 hover:text-amber-400 transition-colors"
              >
                Funniest
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats panel — top right ───────────────────────────── */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`${panel} p-3.5 min-w-[140px]`}>
          <span className={panelLabel}>Network Stats</span>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-muted-foreground">Stories</span>
              <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                {stats.totalStories}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-muted-foreground">Links</span>
              <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                {stats.connections}
              </span>
            </div>
            {stats.funniestStory && (
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-xs text-muted-foreground">Peak Score</span>
                  <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                    {stats.funniestStory.story.funny_score}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Selected node panel — bottom left ────────────────── */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-20 w-72">
          <div className={`${panel} p-4`}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: getNodeBorderColor(selectedNode.story.source_type || 'rss') }}
                />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {selectedNode.story.source_type ?? 'news'}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title */}
            <h3 className="font-display font-bold text-sm text-foreground leading-snug line-clamp-2 mb-2">
              {selectedNode.story.title}
            </h3>

            {/* Source */}
            <p className="text-[11px] text-muted-foreground mb-3 truncate">
              {selectedNode.story.source}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Score</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedNode.story.funny_score ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Votes</span>
                <span className="font-mono font-bold text-green-400">
                  {(selectedNode.story.upvotes ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Tags */}
            {selectedNode.story.tags && selectedNode.story.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedNode.story.tags.slice(0, 5).map((tag, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-400/8 text-amber-400/80 border border-amber-400/15"
                  >
                    {tag}
                  </span>
                ))}
                {selectedNode.story.tags.length > 5 && (
                  <span className="text-[9px] text-muted-foreground/50 py-0.5">
                    +{selectedNode.story.tags.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* CTA */}
            <a
              href={selectedNode.story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-8 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition-colors"
            >
              Read Story
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── Legend — bottom right ─────────────────────────────── */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className={`${panel} p-3.5`}>
          <span className={panelLabel}>Legend</span>
          <div className="space-y-2 mb-3">
            {[
              { color: 'bg-orange-500', label: 'Reddit'  },
              { color: 'bg-blue-500',   label: 'RSS Feed' },
              { color: 'bg-sky-400',    label: 'Twitter'  },
              { color: 'bg-purple-500', label: 'API'      },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="pt-2.5 border-t border-border/30 space-y-1">
            <p className="text-[10px] text-muted-foreground/60">Size = Funny Score</p>
            <p className="text-[10px] text-muted-foreground/60">Lines = Relationships</p>
          </div>
        </div>
      </div>

      {/* ── vis-network canvas ────────────────────────────────── */}
      <div
        ref={containerRef}
        className="w-full relative z-10"
        style={{ height: '75vh' }}
      />
    </div>
  );
}
