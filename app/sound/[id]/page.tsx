'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sound, ApiResponse } from '@/types';
import AudioPlayer from '@/components/AudioPlayer';
import Link from 'next/link';

export default function SoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sound, setSound] = useState<Sound | null>(null);
  const [relatedSounds, setRelatedSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSound = async (id: string) => {
    try {
      const response = await fetch(`/api/sounds/${id}`);
      const result: ApiResponse<Sound> = await response.json();

      if (result.success && result.data) {
        setSound(result.data);
        fetchRelatedSounds(result.data);
      } else {
        setError(result.error || 'Sound not found');
      }
    } catch (err) {
      setError('Failed to load sound');
      console.error('Sound fetch error:', err);
    }
  };

  const fetchRelatedSounds = async (currentSound: Sound) => {
    try {
      // Find sounds with similar tags
      const params = new URLSearchParams({
        tags: currentSound.tags.slice(0, 3).join(','),
        limit: '6'
      });

      const response = await fetch(`/api/sounds?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Filter out current sound and limit results
        const filtered = result.data
          .filter((s: Sound) => s.id !== currentSound.id)
          .slice(0, 4);
        setRelatedSounds(filtered);
      }
    } catch (err) {
      console.error('Related sounds fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id && typeof params.id === 'string') {
      fetchSound(params.id);
    }
  }, [params?.id]);

  const getWeirdnessColor = (score: number) => {
    if (score >= 9) return 'text-red-400';
    if (score >= 7) return 'text-orange-400';
    if (score >= 5) return 'text-yellow-400';
    if (score >= 3) return 'text-green-400';
    return 'text-blue-400';
  };

  const getWeirdnessDescription = (score: number) => {
    if (score >= 9) return 'Absolutely Cursed';
    if (score >= 8) return 'Deeply Unsettling';
    if (score >= 7) return 'Very Weird';
    if (score >= 6) return 'Pretty Strange';
    if (score >= 5) return 'Mildly Odd';
    if (score >= 4) return 'Somewhat Unusual';
    if (score >= 3) return 'A Bit Different';
    return 'Quirky';
  };

  const shareSound = async () => {
    if (!sound) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: sound.title,
          text: `Check out this weird sound: ${sound.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-weird-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sound details...</p>
        </div>
      </div>
    );
  }

  if (error || !sound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-white mb-4">Sound Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-weird-purple hover:bg-weird-pink rounded-lg text-white font-medium transition-colors"
            >
              ← Go Back
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-weird-dark border border-weird-purple/40 hover:bg-weird-purple/20 rounded-lg text-white font-medium transition-colors"
            >
              🏠 Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-weird-cyan hover:text-weird-pink transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {sound.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${{
                  youtube: 'bg-red-500',
                  freesound: 'bg-orange-500',
                  archive: 'bg-purple-500'
                }[sound.source_type]}`}></span>
                <span className="capitalize">{sound.source_type}</span>
              </div>

              {sound.duration && (
                <div>⏱️ {Math.floor(sound.duration / 60)}:{(sound.duration % 60).toString().padStart(2, '0')}</div>
              )}

              <div>📅 {new Date(sound.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Thumbnail */}
          {sound.thumbnail_url && (
            <div className="mb-6">
              <img
                src={sound.thumbnail_url}
                alt={sound.title}
                className="w-full max-w-md rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Audio Player */}
          <div className="mb-8">
            <AudioPlayer sound={sound} autoPlay={false} />
          </div>

          {/* Description */}
          {sound.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">About This Sound</h2>
              <div className="bg-weird-dark rounded-lg p-4 border border-weird-purple/20">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {sound.description}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {sound.tags.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {sound.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/?tags=${encodeURIComponent(tag)}`}
                    className="tag-pill px-3 py-2 rounded-lg text-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {Object.keys(sound.metadata).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">Technical Details</h2>
              <div className="bg-weird-dark rounded-lg p-4 border border-weird-purple/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {sound.metadata.youtube_id && (
                    <div>
                      <span className="text-gray-400">YouTube ID:</span>
                      <span className="text-white ml-2 font-mono">{sound.metadata.youtube_id}</span>
                    </div>
                  )}
                  {sound.metadata.freesound_id && (
                    <div>
                      <span className="text-gray-400">Freesound ID:</span>
                      <span className="text-white ml-2">{sound.metadata.freesound_id}</span>
                    </div>
                  )}
                  {sound.metadata.archive_id && (
                    <div>
                      <span className="text-gray-400">Archive ID:</span>
                      <span className="text-white ml-2 font-mono">{sound.metadata.archive_id}</span>
                    </div>
                  )}
                  {sound.metadata.author && (
                    <div>
                      <span className="text-gray-400">Author:</span>
                      <span className="text-white ml-2">{sound.metadata.author}</span>
                    </div>
                  )}
                  {sound.metadata.license && (
                    <div>
                      <span className="text-gray-400">License:</span>
                      <span className="text-white ml-2">{sound.metadata.license}</span>
                    </div>
                  )}
                  {(sound.metadata.start_time || sound.metadata.end_time) && (
                    <div>
                      <span className="text-gray-400">Clip Range:</span>
                      <span className="text-white ml-2">
                        {sound.metadata.start_time || 0}s - {sound.metadata.end_time || 'end'}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Weirdness Score */}
          <div className="bg-weird-dark rounded-lg p-4 border border-weird-purple/20 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Weirdness Level</h3>
            <div className={`text-4xl font-bold ${getWeirdnessColor(sound.weirdness_score)} mb-2`}>
              {sound.weirdness_score}/10
            </div>
            <div className="text-sm text-gray-400 mb-3">
              {getWeirdnessDescription(sound.weirdness_score)}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-weird-purple to-weird-pink"
                style={{ width: `${(sound.weirdness_score / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-weird-dark rounded-lg p-4 border border-weird-purple/20">
            <h3 className="text-lg font-semibold text-white mb-3">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={shareSound}
                className="w-full px-4 py-2 bg-weird-cyan/20 hover:bg-weird-cyan/30 border border-weird-cyan/40 rounded-lg text-weird-cyan hover:text-white transition-colors text-sm"
              >
                🔗 Share Sound
              </button>
              <a
                href={sound.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-weird-purple/20 hover:bg-weird-purple/30 border border-weird-purple/40 rounded-lg text-weird-purple hover:text-white transition-colors text-sm text-center"
              >
                🔗 View Source
              </a>
              <Link
                href="/graph"
                className="block w-full px-4 py-2 bg-weird-pink/20 hover:bg-weird-pink/30 border border-weird-pink/40 rounded-lg text-weird-pink hover:text-white transition-colors text-sm text-center"
              >
                🕸️ View in Graph
              </Link>
            </div>
          </div>

          {/* Related Sounds */}
          {relatedSounds.length > 0 && (
            <div className="bg-weird-dark rounded-lg p-4 border border-weird-purple/20">
              <h3 className="text-lg font-semibold text-white mb-3">Related Sounds</h3>
              <div className="space-y-3">
                {relatedSounds.map((relatedSound, index) => (
                  <Link
                    key={relatedSound.id}
                    href={`/sound/${relatedSound.id}`}
                    className="block p-3 bg-weird-darker hover:bg-weird-dark/50 rounded-lg border border-gray-700/50 hover:border-weird-purple/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {relatedSound.thumbnail_url && (
                        <img
                          src={relatedSound.thumbnail_url}
                          alt={relatedSound.title}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate group-hover:text-weird-purple transition-colors">
                          {relatedSound.title}
                        </h4>
                        <div className="text-xs text-gray-400 mt-1">
                          🔥 {relatedSound.weirdness_score}/10 • {relatedSound.source_type}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}