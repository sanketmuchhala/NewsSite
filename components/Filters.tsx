'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Calendar, TrendingUp, Globe } from 'lucide-react';

interface FiltersProps {
  onFilterChange: (filters: any) => void;
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const sources = [
    { id: 'reddit', name: 'Reddit', icon: '🚀' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'rss', name: 'RSS Feeds', icon: 'RSS' },
    { id: 'api', name: 'News APIs', icon: '🔌' },
  ];

  const timeRanges = [
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'all', name: 'All Time' },
  ];

  const funnyScoreRanges = [
    { id: 'any', name: 'Any Score', min: 0, max: 100 },
    { id: 'good', name: 'Good (60+)', min: 60, max: 100 },
    { id: 'great', name: 'Great (80+)', min: 80, max: 100 },
    { id: 'hilarious', name: 'Hilarious (90+)', min: 90, max: 100 },
  ];

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (!value || value === 'all' || value === 'any') {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.keys(activeFilters).length;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        
        {getActiveFiltersCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="flex items-center space-x-1">
              <span className="text-xs">
                {key === 'source' ? `Source: ${value}` :
                 key === 'timeRange' ? `Time: ${timeRanges.find(t => t.id === value)?.name}` :
                 key === 'funnyScore' ? `Score: ${funnyScoreRanges.find(f => f.id === value)?.name}` :
                 `${key}: ${value}`}
              </span>
              <button
                onClick={() => handleFilterChange(key, null)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Source Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Source</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sources.map((source) => (
                <Button
                  key={source.id}
                  variant={activeFilters.source === source.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange('source', source.id)}
                  className="justify-start"
                >
                  <span className="mr-2">{source.icon}</span>
                  {source.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Time Range</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={activeFilters.timeRange === range.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange('timeRange', range.id)}
                >
                  {range.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Funny Score Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-foreground">Funny Score</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {funnyScoreRanges.map((range) => (
                <Button
                  key={range.id}
                  variant={activeFilters.funnyScore === range.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange('funnyScore', range.id)}
                >
                  {range.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;