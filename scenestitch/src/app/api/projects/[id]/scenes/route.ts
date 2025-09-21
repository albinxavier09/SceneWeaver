import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjectById, getScenesByProjectId, createScene, getSceneConnections, hasProjectAccess, canEditProject, logActivity } from '@/lib/database';

export async function GET(
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
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(projectId, parseInt(userId));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const scenes = await getScenesByProjectId(projectId);
    const connections = await getSceneConnections(projectId);
    return NextResponse.json({ scenes, connections });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}

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
    
    // Check if user can edit the project
    const canEdit = await canEditProject(projectId, parseInt(userId));
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Scene title is required' },
        { status: 400 }
      );
    }

    const sceneId = await createScene(projectId, title, description);
    
    // Log the activity
    await logActivity(projectId, parseInt(userId), 'scene_created', 'scene', sceneId, `Created scene: ${title}`);
    
    return NextResponse.json({ 
      success: true, 
      sceneId,
      message: 'Scene created successfully' 
    });
  } catch (error) {
    console.error('Error creating scene:', error);
    return NextResponse.json(
      { error: 'Failed to create scene' },
      { status: 500 }
    );
  }
}
