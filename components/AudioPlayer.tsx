'use client';

import { useState, useRef, useEffect } from 'react';
import { Sound } from '@/types';

interface AudioPlayerProps {
  sound: Sound;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

export default function AudioPlayer({ sound, autoPlay = false, onEnded, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<HTMLDivElement>(null);
  const [isYouTubeReady, setIsYouTubeReady] = useState(false);

  useEffect(() => {
    if (sound.source_type === 'youtube' && sound.metadata.youtube_id) {
      loadYouTubePlayer();
    }
  }, [sound]);

  const loadYouTubePlayer = () => {
    if (typeof window === 'undefined') return;

    // Load YouTube IFrame API
    if (!(window as any).YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);

      (window as any).onYouTubeIframeAPIReady = () => {
        createYouTubePlayer();
      };
    } else {
      createYouTubePlayer();
    }
  };

  const createYouTubePlayer = () => {
    if (!youtubeRef.current || !sound.metadata.youtube_id) return;

    const player = new (window as any).YT.Player(youtubeRef.current, {
      height: '0',
      width: '0',
      videoId: sound.metadata.youtube_id,
      playerVars: {
        start: sound.metadata.start_time || 0,
        end: sound.metadata.end_time || undefined,
        autoplay: autoPlay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          setIsYouTubeReady(true);
          setDuration(player.getDuration());
        },
        onStateChange: (event: any) => {
          if (event.data === (window as any).YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setIsLoading(false);
          } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === (window as any).YT.PlayerState.ENDED) {
            setIsPlaying(false);
            onEnded?.();
          } else if (event.data === (window as any).YT.PlayerState.BUFFERING) {
            setIsLoading(true);
          }
        },
        onError: () => {
          setError('Failed to load YouTube video');
          setIsLoading(false);
        }
      }
    });

    (audioRef as any).current = player;
  };

  const togglePlay = async () => {
    if (sound.source_type === 'youtube') {
      if (!isYouTubeReady || !(audioRef as any).current) return;

      const player = (audioRef as any).current;
      if (isPlaying) {
        player.pauseVideo();
      } else {
        setIsLoading(true);
        player.playVideo();
      }
      return;
    }

    // Regular audio playback
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        await audioRef.current.play();
      }
    } catch (err) {
      setError('Failed to play audio');
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);

    if (sound.source_type === 'youtube' && (audioRef as any).current) {
      (audioRef as any).current.seekTo(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }

    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getWaveformBars = () => {
    return Array.from({ length: 20 }, (_, i) => (
      <div
        key={i}
        className={`h-2 w-1 bg-weird-purple rounded-full transition-all duration-150 ${
          isPlaying ? 'animate-pulse' : ''
        }`}
        style={{
          height: isPlaying ? `${Math.random() * 20 + 8}px` : '8px',
          animationDelay: `${i * 0.1}s`
        }}
      />
    ));
  };

  if (error) {
    return (
      <div className={`audio-player p-4 rounded-lg ${className}`}>
        <div className="text-red-400 text-sm">❌ {error}</div>
      </div>
    );
  }

  return (
    <div className={`audio-player p-4 rounded-lg ${className}`}>
      {/* Hidden audio/YouTube elements */}
      {sound.source_type === 'youtube' ? (
        <div ref={youtubeRef} style={{ display: 'none' }} />
      ) : (
        <audio
          ref={audioRef}
          src={sound.source_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); onEnded?.(); }}
          onError={() => setError('Failed to load audio')}
        />
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-12 h-12 rounded-full bg-weird-purple hover:bg-weird-pink transition-colors flex items-center justify-center group disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1.5 h-4 bg-white rounded-full"></div>
              <div className="w-1.5 h-4 bg-white rounded-full"></div>
            </div>
          ) : (
            <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
          )}
        </button>

        {/* Sound Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{sound.title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`px-2 py-1 rounded text-xs ${{
              youtube: 'bg-red-500/20 text-red-300',
              freesound: 'bg-orange-500/20 text-orange-300',
              archive: 'bg-purple-500/20 text-purple-300'
            }[sound.source_type]}`}>
              {sound.source_type}
            </span>
            <span>🔥 {sound.weirdness_score}/10</span>
            {duration > 0 && <span>{formatTime(duration)}</span>}
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="hidden sm:flex items-center gap-1 h-8">
          {getWaveformBars()}
        </div>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="mt-3">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Tags */}
      {sound.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {sound.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="tag-pill px-2 py-1 rounded-full text-xs cursor-pointer"
            >
              #{tag}
            </span>
          ))}
          {sound.tags.length > 5 && (
            <span className="text-xs text-gray-400">+{sound.tags.length - 5} more</span>
          )}
        </div>
      )}
    </div>
  );
}