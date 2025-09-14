'use client';

import { Sound } from '@/types';
import AudioPlayer from './AudioPlayer';
import Link from 'next/link';
import { useState } from 'react';

interface SoundCardProps {
  sound: Sound;
  onPlay?: (sound: Sound) => void;
  showAIEnhance?: boolean;
}

export default function SoundCard({ sound, onPlay }: SoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlayClick = () => {
    onPlay?.(sound);
  };

  const getWeirdnessEmoji = (score: number) => {
    if (score >= 9) return '🌀';
    if (score >= 8) return '👻';
    if (score >= 7) return '🔮';
    if (score >= 6) return '⚡';
    if (score >= 5) return '🌟';
    return '✨';
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'youtube':
        return '📺';
      case 'freesound':
        return '🎵';
      case 'archive':
        return '📚';
      default:
        return '🔊';
    }
  };

  return (
    <div className="sound-card bg-weird-dark rounded-lg overflow-hidden border border-weird-purple/20 hover-glow">
      {/* Thumbnail */}
      {sound.thumbnail_url && (
        <div className="relative h-48 bg-gray-800">
          <img
            src={sound.thumbnail_url}
            alt={sound.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handlePlayClick}
              className="w-16 h-16 rounded-full bg-weird-purple/80 hover:bg-weird-pink/80 transition-colors flex items-center justify-center"
            >
              <div className="w-0 h-0 border-l-6 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link href={`/sound/${sound.id}`} className="block">
              <h3 className="font-semibold text-lg leading-tight hover:text-weird-purple transition-colors">
                {sound.title}
              </h3>
            </Link>
            {sound.description && (
              <p className={`text-gray-400 text-sm mt-1 leading-relaxed ${
                !isExpanded && sound.description.length > 100 ? 'line-clamp-2' : ''
              }`}>
                {isExpanded ? sound.description : sound.description.slice(0, 100)}
                {!isExpanded && sound.description.length > 100 && (
                  <>
                    ...
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="text-weird-cyan hover:text-weird-pink ml-1"
                    >
                      more
                    </button>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-3">
            <span className="text-2xl" title={`${sound.source_type} source`}>
              {getSourceIcon(sound.source_type)}
            </span>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-lg">{getWeirdnessEmoji(sound.weirdness_score)}</span>
                <span className="text-sm font-bold text-weird-purple">
                  {sound.weirdness_score}
                </span>
              </div>
              <div className="text-xs text-gray-500">weirdness</div>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <AudioPlayer sound={sound} className="mb-3" onEnded={() => {}} />

        {/* Tags */}
        {sound.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {sound.tags.slice(0, 6).map((tag, index) => (
              <Link
                key={index}
                href={`/?tags=${encodeURIComponent(tag)}`}
                className="tag-pill px-2 py-1 rounded-full text-xs"
              >
                #{tag}
              </Link>
            ))}
            {sound.tags.length > 6 && (
              <span className="px-2 py-1 text-xs text-gray-400">
                +{sound.tags.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {new Date(sound.created_at).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href={`/sound/${sound.id}`}
              className="hover:text-weird-cyan transition-colors"
            >
              Details →
            </Link>
            <a
              href={sound.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-weird-pink transition-colors"
            >
              Source ↗
            </a>
          </div>
        </div>

        {/* Hidden metadata for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AudioObject",
              "name": sound.title,
              "description": sound.description,
              "contentUrl": sound.source_url,
              "duration": sound.duration ? `PT${sound.duration}S` : undefined,
              "genre": sound.tags.join(', '),
              "dateCreated": sound.created_at,
            })
          }}
        />
      </div>
    </div>
  );
}