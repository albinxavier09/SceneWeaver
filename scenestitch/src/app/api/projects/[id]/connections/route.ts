import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjectById, saveSceneConnection, deleteSceneConnectionByScenes } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
    // Verify project belongs to user
    const project = await getProjectById(projectId, parseInt(userId));
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { fromSceneId, toSceneId, connectionType = 'default' } = await request.json();
    
    if (!fromSceneId || !toSceneId) {
      return NextResponse.json(
        { error: 'fromSceneId and toSceneId are required' },
        { status: 400 }
      );
    }

    const connectionId = await saveSceneConnection(
      parseInt(fromSceneId), 
      parseInt(toSceneId), 
      projectId, 
      connectionType
    );
    
    return NextResponse.json({ 
      success: true,
      connectionId,
      message: 'Connection saved successfully' 
    });
  } catch (error) {
    console.error('Error saving connection:', error);
    return NextResponse.json(
      { error: 'Failed to save connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    
    // Verify project belongs to user
    const project = await getProjectById(projectId, parseInt(userId));
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { fromSceneId, toSceneId } = await request.json();
    
    if (!fromSceneId || !toSceneId) {
      return NextResponse.json(
        { error: 'fromSceneId and toSceneId are required' },
        { status: 400 }
      );
    }

    await deleteSceneConnectionByScenes(parseInt(fromSceneId), parseInt(toSceneId));
    
    return NextResponse.json({ 
      success: true,
      message: 'Connection deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
