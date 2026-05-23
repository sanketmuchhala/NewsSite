'use client';

import React, { useState } from 'react';
import { NewsStory } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ExternalLink, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StoryCardProps {
  story: NewsStory;
}

const GRADIENTS = [
  'from-violet-600/30 via-purple-600/20 to-transparent',
  'from-orange-600/30 via-rose-600/20 to-transparent',
  'from-cyan-600/30 via-blue-600/20 to-transparent',
  'from-emerald-600/30 via-teal-600/20 to-transparent',
  'from-amber-600/30 via-orange-500/20 to-transparent',
  'from-pink-600/30 via-rose-500/20 to-transparent',
  'from-indigo-600/30 via-blue-600/20 to-transparent',
  'from-lime-600/30 via-green-600/20 to-transparent',
];

const SOURCE_COLORS: Record<string, string> = {
  reddit: 'from-orange-600/30 via-orange-500/20 to-transparent',
  twitter: 'from-sky-600/30 via-blue-500/20 to-transparent',
  rss: 'from-amber-600/30 via-yellow-500/20 to-transparent',
  api: 'from-violet-600/30 via-purple-500/20 to-transparent',
};

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  twitter: 'Twitter / X',
  rss: 'RSS',
  api: 'API',
  manual: 'Curated',
};

function getGradient(story: NewsStory): string {
  if (story.source_type && SOURCE_COLORS[story.source_type]) {
    return SOURCE_COLORS[story.source_type];
  }
  let h = 0;
  const s = story.slug ?? '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function FunnyMeter({ score }: { score?: number }) {
  const s = score ?? 50;
  const barColor =
    s >= 90 ? 'bg-green-400' :
    s >= 75 ? 'bg-lime-400' :
    s >= 60 ? 'bg-yellow-400' :
    s >= 45 ? 'bg-orange-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-1.5" title={`Funny score: ${s}/100`}>
      <div className="relative w-14 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} rounded-full`}
          style={{ width: `${s}%` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-amber-400 tabular-nums">{s}</span>
    </div>
  );
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(story.upvotes || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      const response = await fetch(`/api/stories/${story.slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      });
      if (response.ok) {
        if (voteType === 'up') {
          setLocalUpvotes(prev => userVote === 'up' ? prev - 1 : prev + (userVote === 'down' ? 2 : 1));
        } else {
          setLocalUpvotes(prev => userVote === 'down' ? prev + 1 : prev - (userVote === 'up' ? 2 : 1));
        }
        setUserVote(userVote === voteType ? null : voteType);
      }
    } catch (error) {
      console.error('Voting failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const publishedAgo = story.published_at
    ? (() => { try { return formatDistanceToNow(new Date(story.published_at), { addSuffix: true }); } catch { return null; } })()
    : null;

  const gradient = getGradient(story);

  return (
    <Card className="group card-hover overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Gradient Banner */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

      <CardContent className="p-5 flex-1">
        {/* Source row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
              {SOURCE_LABELS[story.source_type ?? ''] ?? story.source_type ?? 'NEWS'}
            </span>
            <span className="font-medium truncate max-w-[120px]">{story.source}</span>
            {story.author && (
              <span className="flex items-center gap-0.5 text-muted-foreground/60">
                <User className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{story.author}</span>
              </span>
            )}
          </div>
          {publishedAgo && (
            <span className="flex items-center gap-1 shrink-0 text-muted-foreground/60">
              <Clock className="w-2.5 h-2.5" />
              {publishedAgo}
            </span>
          )}
        </div>

        {/* Title */}
        <a href={story.url || '#'} target="_blank" rel="noopener noreferrer" className="block group/title mb-3">
          <h3 className="font-display text-base font-semibold text-foreground leading-snug group-hover/title:text-primary transition-colors line-clamp-2">
            {story.title}
          </h3>
        </a>

        {/* Summary */}
        {story.summary && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {story.summary}
          </p>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {story.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {tag}
              </Badge>
            ))}
            {story.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                +{story.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 bg-muted/20 border-t border-border/30">
        <div className="flex items-center justify-between w-full">
          {/* Voting */}
          <div className="flex items-center bg-background/60 rounded-lg border border-border/40 overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 rounded-none border-r border-border/40 transition-colors ${
                userVote === 'up' ? 'bg-green-500/20 text-green-400' : 'hover:bg-green-500/10 hover:text-green-400'
              }`}
              onClick={() => handleVote('up')}
              disabled={isVoting}
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
            <span className="px-2.5 text-xs font-mono font-bold text-foreground min-w-[36px] text-center tabular-nums">
              {localUpvotes.toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 rounded-none border-l border-border/40 transition-colors ${
                userVote === 'down' ? 'bg-red-500/20 text-red-400' : 'hover:bg-red-500/10 hover:text-red-400'
              }`}
              onClick={() => handleVote('down')}
              disabled={isVoting}
            >
              <ArrowDown className="w-3 h-3" />
            </Button>
          </div>

          {/* Right side: funny meter + views + external link */}
          <div className="flex items-center gap-3">
            <FunnyMeter score={story.funny_score} />

            {story.view_count !== undefined && story.view_count > 0 && (
              <span className="hidden sm:block text-[10px] text-muted-foreground/60 tabular-nums">
                {story.view_count >= 1000
                  ? `${(story.view_count / 1000).toFixed(1)}k`
                  : story.view_count} views
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(story.url, '_blank', 'noopener,noreferrer')}
              aria-label="Open original article"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StoryCard;
