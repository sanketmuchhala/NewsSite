'use client';

import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data';
import { GraphData, GraphNode, GraphEdge, Sound } from '@/types';

interface NetworkGraphProps {
  onNodeClick?: (sound: Sound) => void;
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
    totalSounds: 0,
    connections: 0,
    weirdestSound: null as GraphNode | null,
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
    const weirdestSound = data.nodes.reduce((prev, current) =>
      (prev.sound.weirdness_score > current.sound.weirdness_score) ? prev : current
    );

    setStats({
      totalSounds: data.nodes.length,
      connections: data.edges.length,
      weirdestSound,
    });
  };

  const initializeNetwork = () => {
    if (!containerRef.current || !graphData) return;

    const nodes = new DataSet(graphData.nodes);
    const edges = new DataSet(graphData.edges);

    const options = {
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 4,
        chosen: {
          node: (values: any, id: string, selected: boolean, hovering: boolean) => {
            values.borderColor = hovering ? '#EC4899' : '#8B5CF6';
            values.color = hovering ? values.color + '40' : values.color;
          }
        },
        font: {
          color: '#ffffff',
          size: 12,
          face: 'Inter, sans-serif',
          strokeWidth: 2,
          strokeColor: '#000000',
        },
        shadow: {
          enabled: true,
          color: 'rgba(139, 92, 246, 0.3)',
          size: 10,
          x: 0,
          y: 0
        },
        scaling: {
          min: 10,
          max: 50,
          label: {
            enabled: true,
            min: 12,
            max: 18,
          }
        }
      },
      edges: {
        arrows: {
          to: { enabled: false }
        },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5
        },
        shadow: {
          enabled: true,
          color: 'rgba(16, 185, 129, 0.2)',
          size: 5,
        },
        font: {
          color: '#9CA3AF',
          size: 10,
          face: 'Inter, sans-serif',
          strokeWidth: 1,
          strokeColor: '#000000',
        },
        labelHighlightBold: false,
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 100 },
        barnesHut: {
          gravitationalConstant: -8000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.1
        }
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectConnectedEdges: false,
        hover: true,
        hoverConnectedEdges: true,
        tooltipDelay: 200,
      },
      layout: {
        improvedLayout: true,
      }
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = graphData.nodes.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
          onNodeClick?.(node.sound);
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
      console.log(`Stabilization progress: ${progress}%`);
    });

    network.on('stabilizationIterationsDone', () => {
      console.log('Network stabilization completed');
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
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const handleRandomFocus = () => {
    if (networkRef.current && graphData && graphData.nodes.length > 0) {
      const randomNode = graphData.nodes[Math.floor(Math.random() * graphData.nodes.length)];
      networkRef.current.focus(randomNode.id, {
        scale: 1.5,
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
      setSelectedNode(randomNode);
    }
  };

  const handleWeirdestSound = () => {
    if (networkRef.current && stats.weirdestSound) {
      networkRef.current.focus(stats.weirdestSound.id, {
        scale: 2,
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
      setSelectedNode(stats.weirdestSound);
    }
  };

  if (loading) {
    return (
      <div className={`network-container rounded-lg p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-weird-purple border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Building the weird sound network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`network-container rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadGraphData}
            className="px-6 py-3 bg-weird-purple hover:bg-weird-pink rounded-lg text-white font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className={`network-container rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🕳️</div>
          <p className="text-gray-400 mb-4">No sound relationships found</p>
          <p className="text-gray-500">
            The network visualization will appear as sounds are connected through tags and similarities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`network-container rounded-lg overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleFitNetwork}
          className="px-3 py-2 bg-weird-dark/80 backdrop-blur-sm rounded text-white text-sm hover:bg-weird-purple/80 transition-colors"
        >
          🔍 Fit View
        </button>
        <button
          onClick={handleRandomFocus}
          className="px-3 py-2 bg-weird-dark/80 backdrop-blur-sm rounded text-white text-sm hover:bg-weird-cyan/80 transition-colors"
        >
          🎯 Random
        </button>
        {stats.weirdestSound && (
          <button
            onClick={handleWeirdestSound}
            className="px-3 py-2 bg-weird-dark/80 backdrop-blur-sm rounded text-white text-sm hover:bg-weird-pink/80 transition-colors"
          >
            👻 Weirdest
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 bg-weird-dark/80 backdrop-blur-sm rounded-lg p-3 text-sm">
        <div className="text-weird-purple font-semibold mb-1">Network Stats</div>
        <div className="text-gray-300">
          <div>🔊 {stats.totalSounds} sounds</div>
          <div>🔗 {stats.connections} connections</div>
          {stats.weirdestSound && (
            <div>👻 Max weird: {stats.weirdestSound.sound.weirdness_score}/10</div>
          )}
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-weird-dark/90 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate mb-1">
                {selectedNode.sound.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${{
                    youtube: 'bg-red-500',
                    freesound: 'bg-orange-500',
                    archive: 'bg-purple-500'
                  }[selectedNode.sound.source_type]}`}></span>
                  {selectedNode.sound.source_type}
                </span>
                <span>🔥 {selectedNode.sound.weirdness_score}/10</span>
                <span>🏷️ {selectedNode.sound.tags.length} tags</span>
              </div>
              {selectedNode.sound.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedNode.sound.tags.slice(0, 8).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-weird-purple/20 text-weird-purple rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                  {selectedNode.sound.tags.length > 8 && (
                    <span className="text-xs text-gray-500">
                      +{selectedNode.sound.tags.length - 8}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onNodeClick?.(selectedNode.sound)}
                className="px-3 py-2 bg-weird-purple hover:bg-weird-pink rounded text-white text-sm transition-colors"
              >
                🎵 Play
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-400 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Network Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[600px]"
        style={{ height: '80vh' }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-weird-dark/80 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="text-weird-purple font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>YouTube</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Freesound</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Archive.org</span>
          </div>
          <div className="pt-1 border-t border-gray-600 mt-2">
            <div>Node size = weirdness level</div>
            <div>Edge color = relationship type</div>
          </div>
        </div>
      </div>
    </div>
  );
}