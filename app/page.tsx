'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Sound, ApiResponse, PaginatedResponse } from '@/types';
import SoundCard from '@/components/SoundCard';
import { useSearchParams } from 'next/navigation';

function HomePageContent() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [showWeirdRoulette, setShowWeirdRoulette] = useState(false);

  const searchParams = useSearchParams();
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchSounds = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (selectedSource) params.append('source', selectedSource);

      const response = await fetch(`/api/sounds?${params}`);
      const result: PaginatedResponse<Sound> = await response.json();

      if (result.success && result.data) {
        if (reset || pageNum === 1) {
          setSounds(result.data);
        } else {
          setSounds(prev => [...prev, ...result.data!]);
        }

        setHasMore(result.pagination?.hasMore ?? false);
        setError(null);
      } else {
        setError(result.error || 'Failed to load sounds');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, selectedTags, selectedSource]);

  const getWeirdRoulette = async () => {
    setShowWeirdRoulette(true);
    try {
      const response = await fetch('/api/sounds/random');
      const result: ApiResponse<Sound> = await response.json();

      if (result.success && result.data) {
        // Show the weird sound at the top
        setSounds(prev => [result.data!, ...prev.filter(s => s.id !== result.data!.id)]);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Add some fun effects
        document.body.style.animation = 'glitch 0.5s ease-in-out';
        setTimeout(() => {
          document.body.style.animation = '';
        }, 500);
      }
    } catch (err) {
      console.error('Weird roulette error:', err);
    }
    setTimeout(() => setShowWeirdRoulette(false), 1000);
  };

  // Load initial sounds and handle URL params
  useEffect(() => {
    const tagsParam = searchParams?.get('tags');
    if (tagsParam) {
      setSelectedTags(tagsParam.split(','));
    }

    fetchSounds(1, true);
  }, [fetchSounds, searchParams]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchSounds(nextPage);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchSounds]);

  const handleSearch = () => {
    setPage(1);
    fetchSounds(1, true);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setPage(1);
  };

  const popularTags = [
    'cursed', 'liminal', 'experimental', 'glitch', 'ambient',
    'nightmare', 'vintage', 'electronic', 'field-recording', 'lo-fi',
    'disturbing', 'nostalgic', 'abstract', 'drone', 'static'
  ];

  const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  const [konamiIndex, setKonamiIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiSequence[konamiIndex]) {
        setKonamiIndex(prev => prev + 1);
        if (konamiIndex === konamiSequence.length - 1) {
          // Easter egg activated!
          document.body.classList.add('glitch');
          getWeirdRoulette();
          setTimeout(() => document.body.classList.remove('glitch'), 2000);
          setKonamiIndex(0);
        }
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiIndex]);

  if (loading && sounds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-weird-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading weird sounds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-weird-purple via-weird-pink to-weird-cyan bg-clip-text text-transparent">
            Discover the Weird
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Dive into the strangest corners of the internet's audio landscape.
          Cursed sounds, liminal audio, and experimental oddities await.
        </p>

        <button
          onClick={getWeirdRoulette}
          disabled={showWeirdRoulette}
          className="weird-button px-8 py-4 rounded-lg text-white font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {showWeirdRoulette ? (
            <>🎲 Summoning Weirdness...</>
          ) : (
            <>🎲 Weird Sound Roulette</>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-weird-dark rounded-lg p-6 mb-8 border border-weird-purple/20">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search weird sounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 bg-weird-darker border border-weird-purple/30 rounded-lg text-white placeholder-gray-400 focus:border-weird-purple focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-weird-purple hover:bg-weird-pink rounded-lg text-white font-medium transition-colors"
          >
            🔍 Search
          </button>
        </div>

        {/* Source Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSource('')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedSource === ''
                  ? 'bg-weird-purple text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Sources
            </button>
            {[
              { key: 'youtube', label: '📺 YouTube', color: 'bg-red-500' },
              { key: 'freesound', label: '🎵 Freesound', color: 'bg-orange-500' },
              { key: 'archive', label: '📚 Archive.org', color: 'bg-purple-500' }
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setSelectedSource(selectedSource === key ? '' : key)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedSource === key
                    ? `${color} text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Tags */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Popular Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-weird-cyan text-weird-darker'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(selectedTags.length > 0 || selectedSource || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-weird-pink/20 text-weird-pink rounded text-sm">
                  "{searchTerm}"
                </span>
              )}
              {selectedSource && (
                <span className="px-2 py-1 bg-weird-purple/20 text-weird-purple rounded text-sm">
                  Source: {selectedSource}
                </span>
              )}
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-weird-cyan/20 text-weird-cyan rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTags([]);
                  setSelectedSource('');
                  setPage(1);
                  fetchSounds(1, true);
                }}
                className="text-xs text-gray-500 hover:text-weird-pink transition-colors ml-2"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8 text-center">
          <p className="text-red-400">❌ {error}</p>
          <button
            onClick={() => fetchSounds(1, true)}
            className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Sounds Grid */}
      {sounds.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sounds.map((sound, index) => (
              <div
                key={sound.id}
                className={`${index === 0 && showWeirdRoulette ? 'animate-pulse-glow' : ''}`}
              >
                <SoundCard sound={sound} />
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerRef} className="h-20 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-6 h-6 border-2 border-weird-purple border-t-transparent rounded-full animate-spin"></div>
                <span>Loading more weird sounds...</span>
              </div>
            )}
            {!hasMore && sounds.length > 0 && (
              <p className="text-gray-500 text-center">
                You've reached the bottom! 🎉
                <br />
                <small>That's all the weirdness for now...</small>
              </p>
            )}
          </div>
        </>
      ) : !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-gray-400 mb-4">No weird sounds found</p>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or filters, or contribute some sounds!
          </p>
          <button
            onClick={getWeirdRoulette}
            className="weird-button px-6 py-3 rounded-lg text-white font-medium"
          >
            🎲 Try Weird Roulette Instead
          </button>
        </div>
      )}

      {/* Easter Egg Hint */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-600 hover:text-weird-purple transition-colors cursor-help">
        <span title="Try the Konami Code...">👻</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-weird-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading weird sounds discovery...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}