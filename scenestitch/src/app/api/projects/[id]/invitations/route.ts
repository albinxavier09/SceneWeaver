import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  createProjectInvitation,
  getProjectInvitations,
  getProjectInvitationByToken,
  updateInvitationStatus,
  deleteProjectInvitation,
  canEditProject,
  logActivity,
  createNotification,
  addProjectMember,
  getUserByEmail,
  getProjectById
} from '@/lib/database';
import crypto from 'crypto';

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
    
    // Check if user can edit the project
    const canEdit = await canEditProject(projectId, parseInt(userId));
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const invitations = await getProjectInvitations(projectId);
    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
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

    const { email, role, userId: invitedUserId } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json(
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    // Get project info for notifications
    const project = await getProjectById(projectId, parseInt(userId));
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If user ID is provided, add them directly and send notification
    if (invitedUserId) {
      try {
        // Add user to project
        await addProjectMember(projectId, invitedUserId, role, parseInt(userId));
        
        // Create notification for the invited user
        await createNotification(
          invitedUserId,
          'invitation',
          'You\'ve been added to a project',
          `You've been added to the project "${project.name}" as a ${role}`,
          projectId
        );
        
        // Log the activity
        await logActivity(projectId, parseInt(userId), 'member_added', 'project', projectId, `Added user ${email} as ${role}`);
        
        return NextResponse.json({ 
          success: true,
          message: 'User added to project successfully' 
        });
      } catch (error) {
        console.error('Error adding user directly:', error);
        return NextResponse.json(
          { error: 'Failed to add user to project' },
          { status: 500 }
        );
      }
    }

    // Generate invitation token for email invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const result = await createProjectInvitation(
      projectId, 
      email, 
      role, 
      token, 
      expiresAt.toISOString(), 
      parseInt(userId)
    );
    
    // Check if user exists and create notification
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      await createNotification(
        existingUser.id,
        'invitation',
        'Project invitation',
        `You've been invited to join the project "${project.name}" as a ${role}`,
        projectId
      );
    }
    
    // Log the activity
    await logActivity(projectId, parseInt(userId), 'invitation_sent', 'project', projectId, `Invited ${email} as ${role}`);
    
    // In a real implementation, you would send an email here
    const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${token}`;
    
    return NextResponse.json({ 
      success: true,
      invitationId: result.lastID,
      invitationLink,
      message: 'Invitation sent successfully' 
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
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

    const { invitationId } = await request.json();
    
    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitationId is required' },
        { status: 400 }
      );
    }

    await deleteProjectInvitation(invitationId);
    
    // Log the activity
    await logActivity(projectId, parseInt(userId), 'invitation_cancelled', 'project', projectId, `Cancelled invitation ${invitationId}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Invitation cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
