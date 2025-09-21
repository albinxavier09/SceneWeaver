import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { searchUsers } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await searchUsers(query);
    
    // Return users without sensitive information
    const safeUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
