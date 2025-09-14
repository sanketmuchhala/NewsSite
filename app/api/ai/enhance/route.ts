import { NextRequest, NextResponse } from 'next/server';
import { geminiClient } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { title, source, summary, tags } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!source) {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      );
    }

    // Generate enhanced analysis
    const enhancedAnalysis = await geminiClient.generateNewsStoryAnalysis(title, source, tags || []);

    // Generate suggested tags if not provided
    const suggestedTags = tags?.length > 0
      ? tags
      : await geminiClient.categorizeNewsStory(title, source, summary);

    // Calculate funny score
    const funnyScore = await geminiClient.calculateFunnyScore(
      title,
      source,
      enhancedAnalysis || summary,
      suggestedTags
    );

    return NextResponse.json({
      success: true,
      data: {
        originalTitle: title,
        source,
        enhancedAnalysis: enhancedAnalysis || summary,
        suggestedTags,
        funnyScore,
        aiGenerated: !!enhancedAnalysis
      }
    });

  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance news story data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isAvailable = !!process.env.GEMINI_API_KEY;

  return NextResponse.json({
    success: true,
    data: {
      available: isAvailable,
      features: [
        'News story analysis generation',
        'Tag suggestion',
        'Funny score calculation'
      ]
    }
  });
}