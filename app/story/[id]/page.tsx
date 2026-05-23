'use client';

import { useState, useEffect } from 'react';
import { NewsStory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink, ArrowLeft, ThumbsUp, Clock, Share2, Link2, Check,
  Twitter, MessageCircle, Eye,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryPageProps {
  params: { id: string };
}

function estimateReadingTime(text?: string | null): string {
  if (!text) return '< 1 min read';
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function ShareButton({ story }: { story: NewsStory }) {
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`"${story.title}" via FunnyNews`);
    const url = encodeURIComponent(pageUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" /> Share
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 gap-1.5 text-xs"
        onClick={shareOnTwitter}
      >
        <Twitter className="w-3.5 h-3.5" />
        Twitter
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 gap-1.5 text-xs"
        onClick={copyLink}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy link'}
      </Button>
    </div>
  );
}

export default function StoryPage({ params }: StoryPageProps) {
  const [story, setStory] = useState<NewsStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(0);

  useEffect(() => {
    async function fetchStory() {
      try {
        const response = await fetch(`/api/stories/${params.id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setStory(result.data);
          setLocalUpvotes(result.data.upvotes ?? 0);
        } else {
          setError(result.error || 'Story not found');
        }
      } catch {
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    }
    fetchStory();
  }, [params.id]);

  const handleUpvote = async () => {
    if (!story || upvoted) return;
    setUpvoted(true);
    setLocalUpvotes(prev => prev + 1);
    try {
      await fetch(`/api/stories/${story.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: 'up' }),
      });
    } catch {
      // optimistic update stays
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container-responsive py-8 max-w-3xl mx-auto">
          <div className="h-8 bg-muted rounded mb-6 w-32 animate-pulse" />
          <div className="h-12 bg-muted rounded-lg mb-4 animate-pulse" />
          <div className="h-5 bg-muted rounded mb-8 w-64 animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 bg-muted rounded animate-pulse ${i === 4 ? 'w-3/5' : 'w-full'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-6">😵</p>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">Story Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            {error || "The story you're looking for doesn't exist or has been removed."}
          </p>
          <Link href="/">
            <Button size="sm" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const publishedAgo = story.published_at
    ? (() => { try { return formatDistanceToNow(new Date(story.published_at), { addSuffix: true }); } catch { return null; } })()
    : null;
  const readTime = estimateReadingTime(story.summary ?? story.content);

  const funnyLabel =
    (story.funny_score ?? 0) >= 90 ? 'Absolutely Hilarious' :
    (story.funny_score ?? 0) >= 75 ? 'Very Funny' :
    (story.funny_score ?? 0) >= 60 ? 'Pretty Funny' :
    'Mildly Amusing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container-responsive py-8 max-w-3xl mx-auto">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Stories
          </Button>
        </Link>

        <article>
          {/* Header card */}
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden mb-6">
            {/* Color accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

            <div className="p-6 md:p-8">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-5">
                <span className="font-medium text-foreground">{story.source}</span>
                {publishedDate && (
                  <span title={publishedAgo ?? ''} className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {publishedDate}
                    {publishedAgo && <span className="text-muted-foreground/60">· {publishedAgo}</span>}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readTime}
                </span>
                {story.view_count ? (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {story.view_count.toLocaleString()} views
                  </span>
                ) : null}
              </div>

              <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-5 leading-tight tracking-tight">
                {story.title}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {story.funny_score !== undefined && (
                  <Badge className="gap-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
                    😂 {story.funny_score} · {funnyLabel}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1.5">
                  <ThumbsUp className="w-3 h-3" />
                  {localUpvotes.toLocaleString()} upvotes
                </Badge>
                {story.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                <p className="text-foreground text-base leading-relaxed">
                  {story.summary || story.content || 'No summary available for this story.'}
                </p>
              </div>

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Button
                    variant={upvoted ? 'default' : 'outline'}
                    size="sm"
                    className={`gap-2 ${upvoted ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' : ''}`}
                    onClick={handleUpvote}
                    disabled={upvoted}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {upvoted ? 'Upvoted!' : 'Upvote'} ({localUpvotes.toLocaleString()})
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" disabled>
                    <MessageCircle className="w-4 h-4" />
                    Comments
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <ShareButton story={story} />
                </div>
              </div>
            </div>
          </div>

          {/* Read original */}
          {story.url && (
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Read the original story</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{story.url}</p>
              </div>
              <Button asChild size="sm" className="gap-2 shrink-0">
                <a href={story.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
              </Button>
            </div>
          )}

          {/* Comments placeholder */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 mt-6">
            <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Comments
            </h2>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Comments are coming soon — stay tuned!</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
