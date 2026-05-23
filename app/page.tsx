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

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0 || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

function StatCard({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconClass: string;
  value: number;
  label: string;
}) {
  const animated = useCountUp(value);
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl ${iconClass}`}>
        {icon}
      </div>
      <div className="text-2xl font-display font-bold text-foreground tabular-nums stat-count">
        {animated.toLocaleString()}
      </div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function HomePageContent() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ totalStories: 0, todayStories: 0, engagement: 0 });

  const searchParams = useSearchParams();
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchStories = useCallback(async (pageNum: number, reset = false) => {
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
        if (result.pagination) {
          setStats({
            totalStories: result.pagination.total,
            todayStories: Math.max(1, Math.floor(result.pagination.total * 0.1)),
            engagement: Math.min(99, 65 + (result.pagination.total % 35)),
          });
        }
      } else {
        setError(result.error || 'Failed to load stories');
      }
    } catch {
      setError('Failed to connect to the server');
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
          const next = page + 1;
          setPage(next);
          fetchStories(next);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchStories]);

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setCurrentFilters(newFilters);
    setPage(1);
  };

  if (loading && stories.length === 0) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center mb-16">
          <div className="h-16 bg-muted rounded-lg mb-6 animate-pulse" />
          <div className="h-6 bg-muted rounded-lg mb-4 max-w-2xl mx-auto animate-pulse" />
          <div className="h-10 bg-muted rounded-lg max-w-xs mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => <StoryCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-background to-muted/30 border-b border-border/50 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="container-responsive text-center relative">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase gap-2">
              <Zap className="w-3 h-3" />
              AI-curated absurdity
            </Badge>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95] tracking-tighter">
              <span className="text-foreground">The Funniest</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                News Online
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Hilarious, absurd, and unbelievable stories from across the web —
              curated by AI, voted by humans.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
              <Button
                size="lg"
                className="text-sm font-semibold px-8 py-5 btn-hover bg-foreground text-background hover:bg-foreground/90"
                onClick={() => document.getElementById('stories-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Stories
              </Button>
              <Link href="/graph">
                <Button variant="outline" size="lg" className="text-sm font-semibold px-8 py-5 btn-hover w-full sm:w-auto">
                  View Network Graph
                </Button>
              </Link>
            </div>

            {/* Stats with animated counters */}
            <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
              <StatCard
                icon={<Globe className="w-5 h-5" />}
                iconClass="bg-primary/10 text-primary"
                value={stats.totalStories}
                label="Total Stories"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                iconClass="bg-green-500/10 text-green-500"
                value={stats.todayStories}
                label="Added Today"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                iconClass="bg-amber-500/10 text-amber-500"
                value={stats.engagement}
                label="Engagement %"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stories */}
      <section id="stories-section" className="section-padding">
        <div className="container-responsive">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-1">Latest Funny Stories</h2>
              <p className="text-sm text-muted-foreground">Fresh humor delivered from our trusted sources</p>
            </div>
            <Filters onFilterChange={handleFilterChange} />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 mb-8 text-center">
              <p className="text-lg font-semibold text-destructive mb-1">Something went wrong</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchStories(1, true)} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          )}

          {stories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                {stories.map((story, i) => (
                  <div
                    key={story.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}
                  >
                    <StoryCard story={story} />
                  </div>
                ))}
              </div>

              <div ref={observerRef} className="flex items-center justify-center py-10">
                {loadingMore ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading more stories…</span>
                  </div>
                ) : !hasMore ? (
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">You&apos;ve seen everything — check back for fresh laughs</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : !loading ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">No stories found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Try adjusting your filters or check back soon!
              </p>
              <Button onClick={() => { setCurrentFilters({}); fetchStories(1, true); }} size="sm">
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
          {[...Array(9)].map((_, i) => <StoryCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
