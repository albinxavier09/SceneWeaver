import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateDialogue } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sceneData, character, tone } = await request.json();

    if (!sceneData || !sceneData.title) {
      return NextResponse.json(
        { error: 'Scene data with title is required' },
        { status: 400 }
      );
    }

    const dialogue = await generateDialogue(sceneData, character || 'Main Character', tone || 'natural');
    
    return NextResponse.json({ 
      success: true,
      dialogue 
    });
  } catch (error) {
    console.error('Error generating dialogue:', error);
    return NextResponse.json(
      { error: 'Failed to generate dialogue' },
      { status: 500 }
    );
  }
}
