
import { notFound } from 'next/navigation';
import { NewsStory } from '@/types';

interface StoryPageProps {
  params: { id: string };
}

async function getStory(id: string): Promise<NewsStory | null> {
  // In a real app, this would fetch from your API or database
  // For now, a mock fetch
  const res = await fetch(`http://localhost:3000/api/stories/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function StoryPage({ params }: StoryPageProps) {
  const story = await getStory(params.id);

  if (!story) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-4xl font-bold text-white mb-4">{story.title}</h1>
        <p className="text-gray-400 text-sm mb-4">
          Source: {story.source} • Published: {story.published_at ? new Date(story.published_at).toLocaleDateString() : 'N/A'}
        </p>
        <div className="flex items-center space-x-2 mb-6">
          <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            Funny Score: {story.funny_score}
          </span>
          <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            Upvotes: {story.upvotes}
          </span>
          {story.tags && story.tags.map(tag => (
            <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        <p className="text-gray-300 text-lg leading-relaxed mb-8">
          {story.summary}
        </p>

        {/* TODO: Add comments section */}
        <div className="mt-10 pt-6 border-t border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Comments</h2>
          <p className="text-gray-500">Comments section coming soon!</p>
        </div>
      </article>
    </div>
  );
}
