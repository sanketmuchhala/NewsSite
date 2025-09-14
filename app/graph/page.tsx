'use client';

import { useState } from 'react';
import NetworkGraph from '@/components/NetworkGraph';
import AudioPlayer from '@/components/AudioPlayer';
import { Sound } from '@/types';
import Link from 'next/link';

export default function GraphPage() {
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);

  const handleNodeClick = (sound: Sound) => {
    setSelectedSound(sound);
    setIsPlayerMinimized(false);
  };

  const handleClosePlayer = () => {
    setSelectedSound(null);
  };

  return (
    <div className="min-h-screen bg-weird-darker">
      {/* Header */}
      <div className="border-b border-weird-purple/20 bg-weird-darker/90 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-weird-purple to-weird-cyan bg-clip-text text-transparent">
                🕸️ Sound Network
              </h1>
              <p className="text-gray-400 mt-2">
                Explore the interconnected web of weird sounds
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-weird-purple/20 hover:bg-weird-purple/30 border border-weird-purple/40 rounded-lg text-weird-purple hover:text-white transition-colors"
            >
              ← Back to Sounds
            </Link>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div className="relative">
        <NetworkGraph
          onNodeClick={handleNodeClick}
          className="border-none"
        />

        {/* Floating Audio Player */}
        {selectedSound && (
          <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            isPlayerMinimized ? 'w-16 h-16' : 'w-96'
          }`}>
            {isPlayerMinimized ? (
              <button
                onClick={() => setIsPlayerMinimized(false)}
                className="w-16 h-16 rounded-full bg-weird-purple hover:bg-weird-pink shadow-2xl flex items-center justify-center text-white font-bold text-xl hover:scale-105 transition-all"
              >
                🎵
              </button>
            ) : (
              <div className="bg-weird-dark/95 backdrop-blur-lg rounded-lg shadow-2xl border border-weird-purple/30 overflow-hidden">
                <div className="flex items-center justify-between p-2 bg-weird-purple/20">
                  <span className="text-sm font-medium text-white truncate">
                    Now Playing
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsPlayerMinimized(true)}
                      className="w-6 h-6 flex items-center justify-center hover:bg-weird-purple/30 rounded text-gray-400 hover:text-white transition-colors"
                      title="Minimize"
                    >
                      —
                    </button>
                    <button
                      onClick={handleClosePlayer}
                      className="w-6 h-6 flex items-center justify-center hover:bg-weird-pink/30 rounded text-gray-400 hover:text-white transition-colors"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <AudioPlayer
                  sound={selectedSound}
                  autoPlay={true}
                  className="border-none bg-transparent"
                />
                <div className="p-3 border-t border-gray-700">
                  <Link
                    href={`/sound/${selectedSound.id}`}
                    className="text-xs text-weird-cyan hover:text-weird-pink transition-colors"
                  >
                    View full details →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions Overlay */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 bg-weird-dark/80 backdrop-blur-sm rounded-lg px-6 py-3 text-center max-w-md">
          <div className="text-weird-purple text-sm font-medium mb-1">
            🎯 How to explore
          </div>
          <div className="text-xs text-gray-300 leading-relaxed">
            Click nodes to play sounds • Drag to move • Scroll to zoom
            <br />
            Connections show tag similarities and relationships
          </div>
        </div>

        {/* Performance Info */}
        <div className="absolute bottom-6 left-6 z-10 bg-weird-dark/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-400">
          <div>💡 Tip: Larger nodes = higher weirdness scores</div>
          <div className="mt-1">⚡ Physics simulation creates natural clustering</div>
        </div>
      </div>

      {/* Help Modal Trigger */}
      <button
        onClick={() => {
          const modal = document.createElement('div');
          modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] modal-backdrop">
              <div class="bg-weird-dark rounded-lg p-6 max-w-md mx-4 border border-weird-purple/30">
                <h3 class="text-xl font-bold text-weird-purple mb-4">🕸️ Network Guide</h3>
                <div class="space-y-3 text-sm text-gray-300">
                  <div><strong>Nodes:</strong> Each circle represents a unique sound</div>
                  <div><strong>Size:</strong> Larger = higher weirdness score</div>
                  <div><strong>Color:</strong> Red (YouTube), Orange (Freesound), Purple (Archive)</div>
                  <div><strong>Connections:</strong> Lines show relationships between sounds</div>
                  <div><strong>Clustering:</strong> Similar sounds naturally group together</div>
                </div>
                <div class="mt-6 space-y-2 text-xs text-gray-400">
                  <div>🖱️ <strong>Click:</strong> Play sound</div>
                  <div>🖱️ <strong>Drag:</strong> Move nodes around</div>
                  <div>🖱️ <strong>Scroll:</strong> Zoom in/out</div>
                  <div>⌨️ <strong>Buttons:</strong> Use controls for navigation</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()"
                        class="mt-6 w-full px-4 py-2 bg-weird-purple hover:bg-weird-pink rounded text-white transition-colors">
                  Got it! ✨
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
        }}
        className="fixed top-20 right-6 z-40 w-10 h-10 bg-weird-purple/20 hover:bg-weird-purple/30 border border-weird-purple/40 rounded-full flex items-center justify-center text-weird-purple hover:text-white transition-colors text-sm"
        title="Help & Controls"
      >
        ?
      </button>
    </div>
  );
}