import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getProjectById, getSceneById, updateScene, deleteScene } from '@/lib/database';

export async function GET(
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

    const scene = await getSceneById(sceneId, projectId);
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json({ scene });
  } catch (error) {
    console.error('Error fetching scene:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scene' },
      { status: 500 }
    );
  }
}

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

    const updates = await request.json();
    console.log('🔧 API received updates for scene', sceneId, ':', updates);
    console.log('🖼️ image_url in updates:', updates.image_url);
    await updateScene(sceneId, projectId, updates);
    
    return NextResponse.json({ 
      success: true,
      message: 'Scene updated successfully' 
    });
  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await deleteScene(sceneId, projectId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Scene deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { error: 'Failed to delete scene' },
      { status: 500 }
    );
  }
}
