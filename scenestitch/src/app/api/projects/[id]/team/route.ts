import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getProjectMembers, 
  addProjectMember, 
  removeProjectMember, 
  updateProjectMemberRole,
  hasProjectAccess,
  canEditProject,
  getProjectById,
  logActivity
} from '@/lib/database';

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

    const members = await getProjectMembers(projectId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
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
    
    // Check if user can edit the project (owner or editor)
    const canEdit = await canEditProject(projectId, parseInt(userId));
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { userEmail, role } = await request.json();
    
    if (!userEmail || !role) {
      return NextResponse.json(
        { error: 'userEmail and role are required' },
        { status: 400 }
      );
    }

    // For now, we'll add the member directly
    // In a real implementation, you'd send an invitation email
    const result = await addProjectMember(projectId, parseInt(userId), role, parseInt(userId));
    
    // Log the activity
    await logActivity(projectId, parseInt(userId), 'member_added', 'project', projectId, `Added ${userEmail} as ${role}`);
    
    return NextResponse.json({ 
      success: true,
      memberId: result.lastID,
      message: 'Team member added successfully' 
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
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
    
    // Check if user can edit the project
    const canEdit = await canEditProject(projectId, parseInt(userId));
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { memberUserId } = await request.json();
    
    if (!memberUserId) {
      return NextResponse.json(
        { error: 'memberUserId is required' },
        { status: 400 }
      );
    }

    await removeProjectMember(projectId, memberUserId);
    
    // Log the activity
    await logActivity(projectId, parseInt(userId), 'member_removed', 'project', projectId, `Removed user ${memberUserId}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Team member removed successfully' 
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { memberUserId, role } = await request.json();
    
    if (!memberUserId || !role) {
      return NextResponse.json(
        { error: 'memberUserId and role are required' },
        { status: 400 }
      );
    }

    await updateProjectMemberRole(projectId, memberUserId, role);
    
    // Log the activity
    await logActivity(projectId, parseInt(userId), 'member_role_updated', 'project', projectId, `Updated user ${memberUserId} role to ${role}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Team member role updated successfully' 
    });
  } catch (error) {
    console.error('Error updating team member role:', error);
    return NextResponse.json(
      { error: 'Failed to update team member role' },
      { status: 500 }
    );
  }
}
