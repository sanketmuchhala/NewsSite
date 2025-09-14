'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { NewsStory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowLeft, ThumbsUp, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface StoryPageProps {
  params: { id: string };
}

export default function StoryPage({ params }: StoryPageProps) {
  const [story, setStory] = useState<NewsStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStory() {
      try {
        // Try to get the story from the stories API
        const response = await fetch('/api/stories');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Find the story by ID
          const foundStory = result.data.find((s: NewsStory) => s.id && s.id.toString() === params.id);
          if (foundStory) {
            setStory(foundStory);
          } else {
            setError('Story not found');
          }
        } else {
          setError('Failed to load story');
        }
      } catch (err) {
        setError('Failed to connect to the server');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStory();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded-lg mb-6 animate-pulse" />
          <div className="h-12 bg-muted rounded-lg mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded-lg mb-8 max-w-md animate-pulse" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="text-6xl mb-6">😵</div>
          <h1 className="text-3xl font-bold mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'The story you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link href="/">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Stories
            </Button>
          </Link>
        </div>

        {/* Story Content */}
        <article className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8">
            {/* Story Header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
                {story.title}
              </h1>
              
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span>Source: {story.source}</span>
                <span>•</span>
                <span>
                  Published: {story.published_at ? new Date(story.published_at).toLocaleDateString() : 'N/A'}
                </span>
                {story.view_count && (
                  <>
                    <span>•</span>
                    <span>{story.view_count.toLocaleString()} views</span>
                  </>
                )}
              </div>

              {/* Badges and Stats */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Badge variant="secondary" className="gap-2">
                  😂 Funny Score: {story.funny_score || 50}
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <ThumbsUp className="w-3 h-3" />
                  {story.upvotes || 0} upvotes
                </Badge>
                {story.tags && story.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </header>

            {/* Story Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-foreground text-lg leading-relaxed">
                {story.summary || 'No summary available for this story.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-8 border-t border-border">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  Upvote ({story.upvotes || 0})
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments
                </Button>
              </div>
              
              {story.url && (
                <Button asChild variant="default" size="sm" className="gap-2">
                  <a href={story.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Read Original
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Comments
            </h2>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-muted-foreground mb-4">Comments section coming soon!</p>
              <p className="text-sm text-muted-foreground">
                We're working on building an awesome comment system for discussions.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
