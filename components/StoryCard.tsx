'use client';

import React, { useState } from 'react';
import { NewsStory } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ExternalLink, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StoryCardProps {
  story: NewsStory;
}

const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(story.upvotes || 0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      // TODO: Implement actual voting API call
      const response = await fetch(`/api/stories/${story.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      });
      
      if (response.ok) {
        // Update local state optimistically
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

  const formatPublishedDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const getFunnyScoreColor = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (score >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getSourceIcon = (sourceType?: string) => {
    switch (sourceType) {
      case 'reddit': return 'R';
      case 'twitter': return 'T';
      case 'rss': return 'RSS';
      case 'api': return 'API';
      default: return 'N';
    }
  };

  return (
    <Card className="group card-hover overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header with source and timing */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getSourceIcon(story.source_type)}</span>
            <span className="font-medium">{story.source}</span>
            {story.author && (
              <>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{story.author}</span>
                </div>
              </>
            )}
          </div>
          {story.published_at && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatPublishedDate(story.published_at)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link href={`/story/${story.id}`} className="block group/title">
          <h3 className="text-lg font-semibold text-foreground leading-tight mb-3 group-hover/title:text-primary transition-colors line-clamp-2">
            {story.title}
          </h3>
        </Link>

        {/* Summary */}
        {story.summary && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {story.summary}
          </p>
        )}

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {story.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {story.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{story.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
        <div className="flex items-center justify-between w-full">
          {/* Voting */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-background rounded-lg border border-border/50 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 rounded-none border-r border-border/50 ${
                  userVote === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''
                }`}
                onClick={() => handleVote('up')}
                disabled={isVoting}
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium bg-background min-w-[40px] text-center">
                {localUpvotes}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 rounded-none border-l border-border/50 ${
                  userVote === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : ''
                }`}
                onClick={() => handleVote('down')}
                disabled={isVoting}
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center space-x-3">
            {story.funny_score !== undefined && (
              <Badge 
                variant="outline" 
                className={`${getFunnyScoreColor(story.funny_score)} border-0 font-medium`}
              >
                Funny {story.funny_score}%
              </Badge>
            )}
            
            {story.view_count !== undefined && story.view_count > 0 && (
              <span className="text-xs text-muted-foreground">
                {story.view_count.toLocaleString()} views
              </span>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => window.open(story.url, '_blank')}
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