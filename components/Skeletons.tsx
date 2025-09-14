import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export const StoryCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-muted rounded skeleton" />
            <div className="w-16 h-3 bg-muted rounded skeleton" />
            <div className="w-1 h-1 bg-muted rounded-full" />
            <div className="w-12 h-3 bg-muted rounded skeleton" />
          </div>
          <div className="w-20 h-3 bg-muted rounded skeleton" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2 mb-3">
          <div className="w-full h-5 bg-muted rounded skeleton" />
          <div className="w-4/5 h-5 bg-muted rounded skeleton" />
        </div>

        {/* Summary skeleton */}
        <div className="space-y-2 mb-4">
          <div className="w-full h-3 bg-muted rounded skeleton" />
          <div className="w-full h-3 bg-muted rounded skeleton" />
          <div className="w-3/4 h-3 bg-muted rounded skeleton" />
        </div>

        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-1 mb-4">
          <div className="w-12 h-5 bg-muted rounded-full skeleton" />
          <div className="w-16 h-5 bg-muted rounded-full skeleton" />
          <div className="w-10 h-5 bg-muted rounded-full skeleton" />
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
        <div className="flex items-center justify-between w-full">
          {/* Voting skeleton */}
          <div className="flex items-center space-x-2">
            <div className="w-20 h-8 bg-muted rounded-lg skeleton" />
          </div>

          {/* Metrics skeleton */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-5 bg-muted rounded-full skeleton" />
            <div className="w-16 h-3 bg-muted rounded skeleton" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export const GraphSkeleton: React.FC = () => {
  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-8">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-muted-foreground font-medium">Loading Network Graph...</div>
            <div className="text-sm text-muted-foreground">Analyzing story relationships</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <section className="section-padding bg-gradient-to-br from-background to-muted/30 border-b border-border/50">
      <div className="container-responsive text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-48 h-8 bg-muted rounded-full mx-auto skeleton" />
          <div className="space-y-4">
            <div className="w-full h-12 bg-muted rounded-lg skeleton" />
            <div className="w-4/5 h-12 bg-muted rounded-lg mx-auto skeleton" />
          </div>
          <div className="w-3/4 h-6 bg-muted rounded-lg mx-auto skeleton" />
          <div className="flex justify-center space-x-4">
            <div className="w-32 h-12 bg-muted rounded-lg skeleton" />
            <div className="w-32 h-12 bg-muted rounded-lg skeleton" />
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="w-12 h-12 bg-muted rounded-lg mx-auto skeleton" />
                <div className="w-16 h-6 bg-muted rounded mx-auto skeleton" />
                <div className="w-20 h-4 bg-muted rounded mx-auto skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};