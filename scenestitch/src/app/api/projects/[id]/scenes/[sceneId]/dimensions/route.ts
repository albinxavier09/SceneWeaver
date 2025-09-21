import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjectById, updateScene } from '@/lib/database';

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

    const { width, height } = await request.json();
    
    if (!width || !height) {
      return NextResponse.json({ error: 'Width and height are required' }, { status: 400 });
    }

    // Update scene dimensions
    await updateScene(sceneId, projectId, {
      width: Math.round(width),
      height: Math.round(height),
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Scene dimensions updated successfully' 
    });
  } catch (error) {
    console.error('Error updating scene dimensions:', error);
    return NextResponse.json(
      { error: 'Failed to update scene dimensions' },
      { status: 500 }
    );
  }
}
