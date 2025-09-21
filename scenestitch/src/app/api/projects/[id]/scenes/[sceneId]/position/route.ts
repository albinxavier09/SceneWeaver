import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjectById, updateScenePosition } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const sceneId = parseInt(resolvedParams.sceneId);
    
    // Verify project belongs to user
    const project = await getProjectById(projectId, parseInt(userId));
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { positionX, positionY } = await request.json();
    
    if (typeof positionX !== 'number' || typeof positionY !== 'number') {
      return NextResponse.json(
        { error: 'Invalid position data' },
        { status: 400 }
      );
    }

    await updateScenePosition(sceneId, projectId, positionX, positionY);
    
    return NextResponse.json({ 
      success: true,
      message: 'Scene position updated successfully' 
    });
  } catch (error) {
    console.error('Error updating scene position:', error);
    return NextResponse.json(
      { error: 'Failed to update scene position' },
      { status: 500 }
    );
  }
}
