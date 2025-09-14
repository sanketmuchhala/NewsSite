'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { NewsStory, PaginatedResponse } from '@/types';
import StoryCard from '@/components/StoryCard';
import Filters from '@/components/Filters';
import { StoryCardSkeleton } from '@/components/Skeletons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, Zap, Globe, Users } from 'lucide-react';
import Link from 'next/link';

function HomePageContent() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [stats, setStats] = useState({ totalStories: 0, todayStories: 0, trendingScore: 0 });

  const searchParams = useSearchParams();
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchStories = useCallback(async (pageNum: number, reset: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '12',
        ...currentFilters,
      });

      const response = await fetch(`/api/stories?${params}`);
      const result: PaginatedResponse<NewsStory> = await response.json();

      if (result.success && result.data) {
        if (reset || pageNum === 1) {
          setStories(result.data);
        } else {
          setStories(prev => [...prev, ...result.data!]);
        }

        setHasMore(result.pagination?.hasMore ?? false);
        setError(null);
        
        // Update stats from pagination info
        if (result.pagination) {
          setStats({
            totalStories: result.pagination.total,
            todayStories: Math.floor(result.pagination.total * 0.1), // Estimate
            trendingScore: Math.floor(Math.random() * 100) + 50, // Mock trending score
          });
        }
      } else {
        setError(result.error || 'Failed to load stories');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentFilters]);

  useEffect(() => {
    fetchStories(1, true);
  }, [fetchStories, searchParams]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchStories(nextPage);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchStories]);

  const handleFilterChange = (newFilters: any) => {
    setCurrentFilters(newFilters);
    setPage(1);
  };

  if (loading && stories.length === 0) {
    return (
      <div className="container-responsive py-8">
        {/* Hero Skeleton */}
        <div className="text-center mb-16">
          <div className="h-16 bg-muted rounded-lg mb-6 animate-pulse" />
          <div className="h-6 bg-muted rounded-lg mb-4 max-w-2xl mx-auto animate-pulse" />
          <div className="h-10 bg-muted rounded-lg max-w-xs mx-auto animate-pulse" />
        </div>
        
        {/* Stories Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-background to-muted/30 border-b border-border/50">
        <div className="container-responsive text-center">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Powered by AI-driven content discovery
            </Badge>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
              The Funniest News
              <br />
              <span className="text-primary">On The Internet</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover hilarious, absurd, and unbelievable news stories from around the web. 
              Curated by AI, voted by humans, and visualized like never before.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6 btn-hover" onClick={() => {
                document.getElementById('stories-section')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Explore Stories
              </Button>
              <Link href="/graph">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 btn-hover">
                  View Network Graph
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 text-primary">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.totalStories.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Stories</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-green-500/10 text-green-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.todayStories}</div>
                <div className="text-sm text-muted-foreground">Added Today</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-orange-500/10 text-orange-500">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.trendingScore}%</div>
                <div className="text-sm text-muted-foreground">Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section id="stories-section" className="section-padding">
        <div className="container-responsive">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Latest Funny Stories</h2>
              <p className="text-muted-foreground">Fresh humor delivered from our trusted sources</p>
            </div>
            <div className="mt-4 lg:mt-0">
              <Filters onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8 text-center">
              <div className="text-4xl mb-4">😵</div>
              <p className="text-lg font-medium text-destructive mb-2">Oops! Something went wrong</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => fetchStories(1, true)}
                variant="outline"
                className="btn-hover"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Stories Grid */}
          {stories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {stories.map((story, index) => (
                  <div key={story.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <StoryCard story={story} />
                  </div>
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <div ref={observerRef} className="flex items-center justify-center py-12">
                {loadingMore ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading more hilarious stories...</span>
                  </div>
                ) : !hasMore && stories.length > 0 ? (
                  <div className="text-center">
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-lg font-medium text-foreground mb-2">You've reached the end!</p>
                    <p className="text-muted-foreground">Check back later for more laughs</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : !loading ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">?</div>
              <h3 className="text-2xl font-bold text-foreground mb-4">No stories found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any funny stories matching your criteria. Try adjusting your filters or check back later!
              </p>
              <Button 
                onClick={() => {
                  setCurrentFilters({});
                  fetchStories(1, true);
                }}
                className="btn-hover"
              >
                Clear Filters
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container-responsive py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}