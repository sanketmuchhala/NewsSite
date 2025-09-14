import { NextRequest, NextResponse } from 'next/server';
import { geminiClient } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const { title, description, tags } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate enhanced description
    const enhancedDescription = await geminiClient.generateSoundDescription(title, tags || []);

    // Generate suggested tags if not provided
    const suggestedTags = tags?.length > 0
      ? tags
      : await geminiClient.categorizeSound(title, description);

    // Calculate weirdness score
    const weirdnessScore = await geminiClient.calculateWeirdnessScore(
      title,
      enhancedDescription || description,
      suggestedTags
    );

    return NextResponse.json({
      success: true,
      data: {
        originalTitle: title,
        enhancedDescription: enhancedDescription || description,
        suggestedTags,
        weirdnessScore,
        aiGenerated: !!enhancedDescription
      }
    });

  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance sound data' },
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
        'Sound description generation',
        'Tag suggestion',
        'Weirdness score calculation'
      ]
    }
  });
}