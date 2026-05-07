import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';
import { markNotificationRead, markAllNotificationsRead } from '../../lib/utils/notifications';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      notifications: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (body.action === 'mark_all_read') {
      const result = await markAllNotificationsRead(user.id);
      if (!result.success) throw new Error(result.error);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (body.notification_id) {
      const result = await markNotificationRead(body.notification_id);
      if (!result.success) throw new Error(result.error);
      return NextResponse.json({ message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
