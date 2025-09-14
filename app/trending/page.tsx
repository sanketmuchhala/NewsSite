
import { NewsStory } from '@/types';
import StoryCard from '@/components/StoryCard';
import { StoryCardSkeleton } from '@/components/Skeletons';

async function getTrendingStories(): Promise<NewsStory[]> {
  // In a real app, this would fetch from your API or database
  // For now, a mock fetch
  const res = await fetch(`http://localhost:3000/api/stories?sort=trending`);
  if (!res.ok) return [];
  const data = await res.json();
  return data;
}

export default async function TrendingPage() {
  const stories = await getTrendingStories();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8">Trending News</h1>

      {stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-xl text-gray-400 mb-4">No trending stories found</p>
          <p className="text-gray-500 mb-6">
            Check back later for the hottest funny news!
          </p>
        </div>
      )}
    </div>
  );
}
