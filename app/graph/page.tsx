'use client';

import { useState } from 'react';
import NetworkGraph from '@/components/NetworkGraph';
import { NewsStory } from '@/types';
import Link from 'next/link';

export default function GraphPage() {
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);

  const handleNodeClick = (story: NewsStory) => {
    setSelectedStory(story);
    // Open the story URL in a new tab
    if (story.url) {
      window.open(story.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Enhanced Header */}
      <div className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Interactive News Network
              </h1>
              <p className="text-gray-400 text-lg">
                Explore the interconnected web of funny news stories through dynamic visualization
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600 rounded-xl text-gray-200 hover:text-white transition-all duration-200 transform hover:scale-105 font-medium"
            >
              ← Back to Stories
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Graph Container */}
      <div className="relative p-6">
        <NetworkGraph
          onNodeClick={handleNodeClick}
          className="shadow-2xl"
        />

        {/* Enhanced Instructions Overlay */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl px-8 py-4 text-center max-w-lg border border-gray-600/30">
            <div className="text-blue-400 text-sm font-semibold mb-2 flex items-center justify-center gap-2">
              Interactive Network Guide
            </div>
            <div className="text-xs text-gray-300 leading-relaxed space-y-1">
              <div><strong>Click nodes</strong> to open news articles • <strong>Drag</strong> to explore relationships</div>
              <div><strong>Scroll</strong> to zoom • <strong>Use controls</strong> for advanced navigation</div>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="absolute bottom-12 left-12 z-30 pointer-events-none">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl px-4 py-3 text-xs text-gray-400 max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400">Pro Tips</span>
            </div>
            <div className="space-y-1 text-[11px] leading-relaxed">
              <div>• Larger nodes = higher funny scores</div>
              <div>• Colors indicate source platforms</div>
              <div>• Physics creates natural story clustering</div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal Trigger */}
      <button
        onClick={() => {
          const modal = document.createElement('div');
          modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] modal-backdrop">
              <div class="bg-gray-900 rounded-lg p-6 max-w-md mx-4 border border-primary/30">
                <h3 class="text-xl font-bold text-primary mb-4">Network Guide</h3>
                <div class="space-y-3 text-sm text-gray-300">
                  <div><strong>Nodes:</strong> Each circle represents a news story</div>
                  <div><strong>Size:</strong> Larger = higher funny score</div>
                  <div><strong>Color:</strong> Orange (Reddit), Blue (RSS), Purple (API)</div>
                  <div><strong>Connections:</strong> Lines show relationships between stories</div>
                  <div><strong>Clustering:</strong> Similar stories naturally group together</div>
                </div>
                <div class="mt-6 space-y-2 text-xs text-gray-400">
                  <div><strong>Click:</strong> Open story</div>
                  <div><strong>Drag:</strong> Move nodes around</div>
                  <div><strong>Scroll:</strong> Zoom in/out</div>
                  <div><strong>Buttons:</strong> Use controls for navigation</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()"
                        class="mt-6 w-full px-4 py-2 bg-primary hover:bg-primary/80 rounded text-white transition-colors">
                  Got it!
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
        }}
        className="fixed top-20 right-6 z-40 w-10 h-10 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full flex items-center justify-center text-primary hover:text-white transition-colors text-sm"
        title="Help & Controls"
      >
        ?
      </button>
    </div>
  );
}