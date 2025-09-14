'use client';

import { useState, useEffect } from 'react';
import { NewsStory } from '@/types';
import StoryCard from '@/components/StoryCard';
import { StoryCardSkeleton } from '@/components/Skeletons';

export default function TrendingPage() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrendingStories() {
      try {
        const response = await fetch('/api/stories?sort=trending&pageSize=20');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Sort by upvotes and funny_score for trending
          const sortedStories = result.data
            .sort((a: NewsStory, b: NewsStory) => {
              const scoreA = (a.upvotes || 0) + (a.funny_score || 0) * 0.1;
              const scoreB = (b.upvotes || 0) + (b.funny_score || 0) * 0.1;
              return scoreB - scoreA;
            })
            .slice(0, 15); // Top 15 trending stories
          
          setStories(sortedStories);
        } else {
          setError(result.error || 'Failed to load trending stories');
        }
      } catch (err) {
        setError('Failed to connect to the server');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingStories();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Trending News</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Trending News</h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😵</div>
          <p className="text-xl text-gray-400 mb-4">Failed to load trending stories</p>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8">Trending News</h1>

      {stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-xl text-gray-400 mb-4">No trending stories found</p>
          <p className="text-gray-500 mb-6">
            Check back later for the hottest funny news!
          </p>
        </div>
      )}
    </div>
  );
}
