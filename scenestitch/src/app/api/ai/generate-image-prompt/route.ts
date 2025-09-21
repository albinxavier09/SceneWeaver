import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateImagePrompt } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sceneDescription } = await request.json();

    if (!sceneDescription) {
      return NextResponse.json(
        { error: 'Scene description is required' },
        { status: 400 }
      );
    }

    const imagePrompt = await generateImagePrompt(sceneDescription);
    
    return NextResponse.json({ 
      success: true,
      imagePrompt 
    });
  } catch (error) {
    console.error('Error generating image prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate image prompt' },
      { status: 500 }
    );
  }
}
