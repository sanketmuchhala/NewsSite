
import React from 'react';

interface Source {
  name: string;
  url: string;
  credibility: 'high' | 'medium' | 'low';
  storyCount: number;
}

async function getSources(): Promise<Source[]> {
  // In a real app, this would fetch from your API or database
  // For now, a mock data
  return [
    { name: 'Reddit - r/nottheonion', url: 'https://www.reddit.com/r/nottheonion', credibility: 'medium', storyCount: 120 },
    { name: 'Reddit - r/funny', url: 'https://www.reddit.com/r/funny', credibility: 'low', storyCount: 300 },
    { name: 'The Onion', url: 'https://www.theonion.com', credibility: 'high', storyCount: 80 },
    { name: 'Babylon Bee', url: 'https://babylonbee.com', credibility: 'medium', storyCount: 70 },
    { name: 'News Of The Stupid', url: 'https://www.reddit.com/r/NewsOfTheStupid', credibility: 'medium', storyCount: 90 },
  ];
}

export default async function SourcesPage() {
  const sources = await getSources();

  const getCredibilityColor = (credibility: Source['credibility']) => {
    switch (credibility) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8">News Sources</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div key={source.name} className="bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-white mb-2">{source.name}</h2>
            <p className="text-gray-400 mb-3">
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {source.url}
              </a>
            </p>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getCredibilityColor(source.credibility)}`}>
                {source.credibility.charAt(0).toUpperCase() + source.credibility.slice(1)}
              </span>
              <span className="text-gray-500 text-sm">{source.storyCount} stories</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
