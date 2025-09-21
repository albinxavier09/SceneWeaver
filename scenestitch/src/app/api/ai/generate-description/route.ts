import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSceneDescription } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sceneData = await request.json();

    if (!sceneData || !sceneData.title) {
      return NextResponse.json(
        { error: 'Scene data with title is required' },
        { status: 400 }
      );
    }

    const description = await generateSceneDescription(sceneData);
    
    return NextResponse.json({ 
      success: true,
      description 
    });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
