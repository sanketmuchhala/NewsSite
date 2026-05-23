'use client';

import { useState, useEffect } from 'react';
import { NewsStory } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUp, ExternalLink, TrendingUp, Flame, Clock } from 'lucide-react';
import { StoryCardSkeleton } from '@/components/Skeletons';
import { formatDistanceToNow } from 'date-fns';

const RANK_LABELS = ['01', '02', '03'];
const RANK_COLORS = [
  'border-amber-400/30 bg-amber-400/[0.04]',
  'border-border/50 bg-muted/[0.04]',
  'border-border/40 bg-muted/[0.03]',
];
const RANK_NUM_COLORS = ['text-amber-400', 'text-muted-foreground/60', 'text-muted-foreground/50'];

function TrendingScore({ story }: { story: NewsStory }) {
  const score = (story.upvotes || 0) + (story.funny_score || 0) * 0.1;
  return (
    <span className="text-xs font-mono text-muted-foreground tabular-nums">
      {Math.round(score).toLocaleString()} pts
    </span>
  );
}

function TopCard({ story, rank }: { story: NewsStory; rank: number }) {
  const publishedAgo = story.published_at
    ? (() => { try { return formatDistanceToNow(new Date(story.published_at), { addSuffix: true }); } catch { return null; } })()
    : null;

  return (
    <div className={`relative rounded-xl border ${RANK_COLORS[rank]} p-6 flex flex-col gap-3 hover:shadow-lg transition-all duration-200 group`}>
      <div className="flex items-start gap-3">
        <span className={`font-mono font-black text-2xl leading-none mt-0.5 shrink-0 tabular-nums ${RANK_NUM_COLORS[rank]}`}>
          {RANK_LABELS[rank]}
        </span>
        <div className="flex-1 min-w-0">
          <Link href={`/story/${story.id}`}>
            <h3 className="font-display font-bold text-foreground text-lg leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
              {story.title}
            </h3>
          </Link>
        </div>
      </div>

      {story.summary && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {story.summary}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
            <ArrowUp className="w-3 h-3" />
            {(story.upvotes || 0).toLocaleString()}
          </span>
          {story.funny_score !== undefined && (
            <span className="text-[10px] font-mono font-bold text-amber-400/70">
              Score {story.funny_score}
            </span>
          )}
          {publishedAgo && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Clock className="w-2.5 h-2.5" />
              {publishedAgo}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => window.open(story.url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function RankedRow({ story, rank }: { story: NewsStory; rank: number }) {
  const publishedAgo = story.published_at
    ? (() => { try { return formatDistanceToNow(new Date(story.published_at), { addSuffix: true }); } catch { return null; } })()
    : null;

  return (
    <div className="group flex items-start gap-4 py-4 px-4 -mx-4 rounded-xl hover:bg-muted/40 transition-colors">
      <span className="w-8 text-center font-display font-bold text-lg text-muted-foreground/50 shrink-0 mt-0.5 tabular-nums">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <Link href={`/story/${story.id}`}>
          <h3 className="font-display font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
            {story.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">{story.source}</span>
          <span className="flex items-center gap-1 text-xs text-green-400">
            <ArrowUp className="w-3 h-3" />
            {(story.upvotes || 0).toLocaleString()}
          </span>
          {story.funny_score !== undefined && (
            <span className="text-[10px] font-mono text-amber-400/60">Score {story.funny_score}</span>
          )}
          {publishedAgo && (
            <span className="text-[10px] text-muted-foreground/50">{publishedAgo}</span>
          )}
        </div>
      </div>
      <TrendingScore story={story} />
    </div>
  );
}

export default function TrendingPage() {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/stories?sort=trending&pageSize=20');
        const result = await response.json();
        if (result.success && result.data) {
          const sorted: NewsStory[] = [...result.data].sort((a, b) => {
            const sa = (a.upvotes || 0) + (a.funny_score || 0) * 0.1;
            const sb = (b.upvotes || 0) + (b.funny_score || 0) * 0.1;
            return sb - sa;
          });
          setStories(sorted.slice(0, 15));
        } else {
          setError(result.error || 'Failed to load trending stories');
        }
      } catch {
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="section-padding">
          <div className="container-responsive">
            <div className="h-20 bg-muted rounded-xl mb-8 animate-pulse max-w-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[...Array(3)].map((_, i) => <StoryCardSkeleton key={i} />)}
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-2xl mb-4 text-muted-foreground">x_x</p>
          <p className="font-display text-xl font-bold text-foreground mb-2">Failed to load</p>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} size="sm">Try Again</Button>
        </div>
      </div>
    );
  }

  const top3 = stories.slice(0, 3);
  const rest = stories.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero */}
      <section className="section-padding border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="container-responsive relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Trending Now
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Top {stories.length} stories ranked by votes & funny score
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-responsive">
          {stories.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-2xl mb-4 text-muted-foreground/40">--</p>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">No trending stories yet</h3>
              <p className="text-sm text-muted-foreground">Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {top3.length > 0 && (
                <div className="mb-10">
                  <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Podium
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {top3.map((story, i) => (
                      <TopCard key={story.id} story={story} rank={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Ranked list */}
              {rest.length > 0 && (
                <div>
                  <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Rankings
                  </h2>
                  <div className="rounded-xl border border-border/50 bg-card/50 divide-y divide-border/30 overflow-hidden">
                    {rest.map((story, i) => (
                      <div key={story.id} className="px-4">
                        <RankedRow story={story} rank={i + 4} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
