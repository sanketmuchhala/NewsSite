'use client';

import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { GraphData, GraphNode, GraphEdge, NewsStory } from '@/types';

interface NetworkGraphProps {
  onNodeClick?: (story: NewsStory) => void;
  className?: string;
}

export default function NetworkGraph({ onNodeClick, className = '' }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({
    totalStories: 0,
    connections: 0,
    funniestStory: null as GraphNode | null,
  });

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/graph');
      const result = await response.json();

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

    setStats({
      totalStories: data.nodes.length,
      connections: data.edges.length,
      funniestStory,
    });
  };

  // Enhanced color functions for better visual design
  const getNodeBackgroundColor = (sourceType: string, funnyScore: number): string => {
    const colors = {
      reddit: { r: 255, g: 69, b: 0 },    // Reddit orange
      rss: { r: 59, g: 130, b: 246 },    // Blue
      twitter: { r: 29, g: 161, b: 242 }, // Twitter blue
      api: { r: 147, g: 51, b: 234 }      // Purple
    };
    
    const color = colors[sourceType as keyof typeof colors] || colors.rss;
    const intensity = Math.max(0.8, Math.min(1, funnyScore / 100));
    
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`;
  };

  const getNodeBorderColor = (sourceType: string): string => {
    const colors = {
      reddit: '#ff6b35',
      rss: '#60a5fa', 
      twitter: '#38bdf8',
      api: '#a855f7'
    };
    
    return colors[sourceType as keyof typeof colors] || colors.rss;
  };

  const getNodeHighlightColor = (sourceType: string): string => {
    const colors = {
      reddit: '#ff8c42',
      rss: '#93c5fd',
      twitter: '#7dd3fc', 
      api: '#c084fc'
    };
    
    return colors[sourceType as keyof typeof colors] || colors.rss;
  };

  const getEdgeColor = (relationshipType: string): string => {
    const colors = {
      similar: '#10b981',     // Green
      related: '#6b7280',     // Gray
      follow_up: '#8b5cf6',   // Purple
      contradicts: '#ef4444', // Red
      updates: '#f59e0b'      // Amber
    };

    return colors[relationshipType as keyof typeof colors] || colors.related;
  };

  const getEdgeHighlightColor = (relationshipType: string): string => {
    const colors = {
      similar: '#34d399',
      related: '#9ca3af',
      follow_up: '#a78bfa',
      contradicts: '#f87171',
      updates: '#fbbf24'
    };

    return colors[relationshipType as keyof typeof colors] || colors.related;
  };

  const initializeNetwork = () => {
    if (!containerRef.current || !graphData) return;

    const nodes = new DataSet(graphData.nodes.map((node: GraphNode) => ({
      id: node.id,
      label: node.label,
      title: node.title,
      color: {
        background: getNodeBackgroundColor(node.story.source_type || 'rss', node.story.funny_score || 50),
        border: getNodeBorderColor(node.story.source_type || 'rss'),
        highlight: {
          background: getNodeHighlightColor(node.story.source_type || 'rss'),
          border: '#ffffff'
        },
        hover: {
          background: getNodeHighlightColor(node.story.source_type || 'rss'),
          border: '#ffffff'
        }
      },
      size: Math.max(20, Math.min(50, (node.story.funny_score || 50) * 0.5)),
      font: {
        color: '#ffffff',
        size: 13,
        face: 'Inter, system-ui, sans-serif',
        strokeWidth: 2,
        strokeColor: 'rgba(0, 0, 0, 0.8)'
      },
      borderWidth: 2,
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.3)',
        size: 8,
        x: 2,
        y: 2
      },
      story: node.story
    })));
    
    const edges = new DataSet(graphData.edges.map((edge: GraphEdge) => ({
      id: `${edge.from}-${edge.to}`,
      from: edge.from,
      to: edge.to,
      label: edge.label,
      color: {
        color: getEdgeColor(edge.relationship?.relationship_type || 'related'),
        highlight: getEdgeHighlightColor(edge.relationship?.relationship_type || 'related'),
        opacity: 0.7
      },
      width: Math.max(2, Math.min(6, (edge.relationship?.strength || 0.5) * 8)),
      font: {
        color: '#e5e7eb',
        size: 11,
        face: 'Inter, system-ui, sans-serif',
        strokeWidth: 3,
        strokeColor: '#1f2937',
        background: 'rgba(31, 41, 55, 0.8)'
      },
      smooth: {
        enabled: true,
        type: 'curvedCW',
        roundness: 0.2
      }
    })));

    const options: any = {
      nodes: {
        borderWidth: 3,
        borderWidthSelected: 4,
        font: {
          color: '#ffffff',
          size: 13,
          face: 'Inter, system-ui, sans-serif',
          strokeWidth: 2,
          strokeColor: 'rgba(0, 0, 0, 0.8)',
        },
        shadow: {
          enabled: true,
          color: 'rgba(0, 0, 0, 0.2)',
          size: 10,
          x: 2,
          y: 2
        },
        scaling: {
          min: 20,
          max: 50,
          label: {
            enabled: true,
            min: 12,
            max: 16,
          }
        },
        shape: 'dot'
      },
      edges: {
        arrows: {
          to: { 
            enabled: true, 
            scaleFactor: 0.8,
            type: 'arrow'
          }
        },
        smooth: {
          enabled: true,
          type: 'curvedCW',
          roundness: 0.15
        },
        shadow: {
          enabled: true,
          color: 'rgba(0, 0, 0, 0.1)',
          size: 3,
        },
        font: {
          color: '#e5e7eb',
          size: 11,
          face: 'Inter, system-ui, sans-serif',
          strokeWidth: 3,
          strokeColor: '#1f2937',
          background: 'rgba(31, 41, 55, 0.8)'
        },
        labelHighlightBold: false,
      },
      physics: {
        enabled: true,
        stabilization: { 
          iterations: 150,
          updateInterval: 25
        },
        barnesHut: {
          gravitationalConstant: -12000,
          centralGravity: 0.35,
          springLength: 120,
          springConstant: 0.05,
          damping: 0.12,
          avoidOverlap: 0.2
        },
        maxVelocity: 40,
        minVelocity: 0.75,
        timestep: 0.35
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectConnectedEdges: true,
        hover: true,
        hoverConnectedEdges: true,
        tooltipDelay: 300,
        zoomSpeed: 1.2
      },
      layout: {
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: false
      }
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);

    // Enhanced event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = graphData.nodes.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
          onNodeClick?.(node.story);
        }
      } else {
        setSelectedNode(null);
      }
    });

    network.on('hoverNode', (params) => {
      const nodeId = params.node;
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node && containerRef.current) {
        containerRef.current.style.cursor = 'pointer';
      }
    });

    network.on('blurNode', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    });

    network.on('stabilizationProgress', (params) => {
      const progress = Math.round((params.iterations / params.total) * 100);
      console.log(`Network stabilization: ${progress}%`);
    });

    network.on('stabilizationIterationsDone', () => {
      console.log('Network stabilized - enabling smooth interactions');
      network.setOptions({ physics: { enabled: false } });
    });

    networkRef.current = network;
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  useEffect(() => {
    if (graphData && !loading) {
      initializeNetwork();
    }

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData, loading]);

  const handleFitNetwork = () => {
    if (networkRef.current) {
      networkRef.current.fit({
        animation: {
          duration: 1200,
          easingFunction: 'easeInOutCubic'
        }
      });
    }
  };

  const handleRandomFocus = () => {
    if (networkRef.current && graphData && graphData.nodes.length > 0) {
      const randomNode = graphData.nodes[Math.floor(Math.random() * graphData.nodes.length)];
      networkRef.current.focus(randomNode.id, {
        scale: 1.8,
        animation: {
          duration: 1200,
          easingFunction: 'easeInOutCubic'
        }
      });
      setSelectedNode(randomNode);
    }
  };

  const handleFunniestStory = () => {
    if (networkRef.current && stats.funniestStory) {
      networkRef.current.focus(stats.funniestStory.id, {
        scale: 2.2,
        animation: {
          duration: 1200,
          easingFunction: 'easeInOutCubic'
        }
      });
      setSelectedNode(stats.funniestStory);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-xl border border-gray-700/50 ${className}`}>
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <div className="space-y-2">
            <div className="text-white font-medium text-lg">Building News Network</div>
            <div className="text-gray-400 text-sm">Analyzing story relationships and connections...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] bg-gradient-to-br from-red-900/20 via-gray-900 to-gray-800 rounded-xl border border-red-500/30 ${className}`}>
        <div className="text-center space-y-6 p-8">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <div className="space-y-2">
            <div className="text-white font-medium text-lg">Network Unavailable</div>
            <div className="text-gray-400 text-sm max-w-md">{error}</div>
          </div>
          <button
            onClick={loadGraphData}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative network-container rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50 ${className}`}>
      {/* Enhanced Control Panel */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-3">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-3 border border-gray-600/50">
          <div className="text-xs font-medium text-gray-300 mb-3 uppercase tracking-wide">Navigation</div>
          <div className="space-y-2">
            <button
              onClick={handleFitNetwork}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              🔍 Fit All
            </button>
            <button
              onClick={handleRandomFocus}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              🎯 Explore
            </button>
            {stats.funniestStory && (
              <button
                onClick={handleFunniestStory}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105"
              >
                😂 Funniest
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Panel */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border border-gray-600/50">
          <div className="text-xs font-medium text-gray-300 mb-3 uppercase tracking-wide">Network Stats</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Stories</span>
              <span className="text-blue-400 font-medium">{stats.totalStories}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Links</span>
              <span className="text-green-400 font-medium">{stats.connections}</span>
            </div>
            {stats.funniestStory && (
              <div className="pt-2 border-t border-gray-600">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Peak Funny</span>
                  <span className="text-pink-400 font-medium">{stats.funniestStory.story.funny_score}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Selected Node Panel */}
      {selectedNode && (
        <div className="absolute bottom-6 left-6 z-20 max-w-sm">
          <div className="bg-gray-800/95 backdrop-blur-lg rounded-xl p-5 border border-gray-600/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  selectedNode.story.source_type === 'reddit' ? 'bg-orange-500' :
                  selectedNode.story.source_type === 'rss' ? 'bg-blue-500' : 'bg-purple-500'
                }`}></div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {selectedNode.story.source_type}
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 flex items-center justify-center hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-white font-medium text-sm leading-relaxed line-clamp-2">
                {selectedNode.story.title}
              </h3>
              
              <div className="text-xs text-gray-400">
                {selectedNode.story.source}
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Funny:</span>
                  <span className="text-pink-400 font-medium">{selectedNode.story.funny_score}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Votes:</span>
                  <span className="text-green-400 font-medium">{selectedNode.story.upvotes}</span>
                </div>
              </div>

              {selectedNode.story.tags && selectedNode.story.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.story.tags.slice(0, 6).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {selectedNode.story.tags.length > 6 && (
                    <span className="text-xs text-gray-500 py-1">
                      +{selectedNode.story.tags.length - 6} more
                    </span>
                  )}
                </div>
              )}
              
              <a
                href={selectedNode.story.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105"
              >
                📖 Read Story
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Network Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[600px]"
        style={{ height: '85vh' }}
      />

      {/* Enhanced Legend */}
      <div className="absolute bottom-6 right-6 z-20">
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border border-gray-600/50">
          <div className="text-xs font-medium text-gray-300 mb-3 uppercase tracking-wide">Legend</div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-300">Reddit</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-300">RSS Feed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-300">API Source</span>
            </div>
            <div className="pt-2 border-t border-gray-600 space-y-1">
              <div className="text-gray-400">Size = Funny Score</div>
              <div className="text-gray-400">Lines = Relationships</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-6 py-4 text-center max-w-md opacity-0 animate-fade-in" style={{ animationDelay: '2s', animationFillMode: 'forwards' }}>
          <div className="text-blue-400 text-sm font-medium mb-2">
            🎯 Interactive News Network
          </div>
          <div className="text-xs text-gray-300 leading-relaxed">
            Click nodes to read stories • Drag to explore • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}