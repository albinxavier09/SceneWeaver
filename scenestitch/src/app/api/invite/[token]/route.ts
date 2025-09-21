import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getProjectInvitationByToken,
  updateInvitationStatus,
  addProjectMember,
  getUserByEmail,
  logActivity
} from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    
    const invitation = await getProjectInvitationByToken(token);
    
    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      invitation: {
        id: invitation.id,
        projectId: invitation.project_id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const token = resolvedParams.token;
    
    const invitation = await getProjectInvitationByToken(token);
    
    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation' 
      }, { status: 404 });
    }
    
    // Check if user email matches invitation email
    const user = await getUserByEmail(invitation.email);
    if (!user || user.id !== parseInt(userId)) {
      return NextResponse.json({ 
        error: 'Invitation email does not match your account' 
      }, { status: 400 });
    }
    
    // Add user to project
    await addProjectMember(
      invitation.project_id, 
      parseInt(userId), 
      invitation.role, 
      invitation.created_by
    );
    
    // Mark invitation as accepted
    await updateInvitationStatus(token, 'accepted');
    
    // Log the activity
    await logActivity(
      invitation.project_id, 
      parseInt(userId), 
      'invitation_accepted', 
      'project', 
      invitation.project_id, 
      `Accepted invitation as ${invitation.role}`
    );
    
    return NextResponse.json({ 
      success: true,
      projectId: invitation.project_id,
      message: 'Invitation accepted successfully' 
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
