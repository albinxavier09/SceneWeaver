import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getProjectActivity,
  hasProjectAccess
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const activity = await getProjectActivity(projectId, limit);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error fetching project activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project activity' },
      { status: 500 }
    );
  }
}
