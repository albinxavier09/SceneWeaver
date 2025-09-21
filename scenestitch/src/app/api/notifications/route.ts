import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getNotifications, 
  markAllNotificationsAsRead, 
  getUnreadNotificationCount 
} from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const [notifications, unreadCount] = await Promise.all([
      getNotifications(parseInt(userId), limit),
      getUnreadNotificationCount(parseInt(userId))
    ]);

    return NextResponse.json({ 
      notifications, 
      unreadCount 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'mark_all_read') {
      await markAllNotificationsAsRead(parseInt(userId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
