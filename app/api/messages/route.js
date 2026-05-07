import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';
import { createNotification } from '../../lib/utils/notifications';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const withUser = searchParams.get('with');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name, avatar_url),
        receiver:receiver_id(id, email, full_name, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (withUser) {
      query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${withUser}),and(sender_id.eq.${withUser},receiver_id.eq.${user.id})`);
    } else {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Mark received messages as read if viewing conversation
    if (withUser) {
      const unread = (data || []).filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
      if (unread.length) {
        await supabaseAdmin
          .from('messages')
          .update({ read: true, read_at: new Date().toISOString() })
          .in('id', unread);
      }
    }

    return NextResponse.json({
      messages: data.reverse(), // Reverse to show oldest first
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

export async function POST(request) {
  try {
    const user = await getCallerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiver_id, content, requisition_id, attachments } = await request.json();

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        content: content.trim(),
        requisition_id: requisition_id || null,
        attachments: attachments || [],
      })
      .select(`
        *,
        sender:sender_id(id, email, full_name, avatar_url),
        receiver:receiver_id(id, email, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Get sender name
    const { data: senderData } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Notify receiver
    await createNotification({
      userId: receiver_id,
      type: 'message',
      title: 'New Message',
      message: `${senderData?.full_name || user.email} sent you a message`,
      link: `/messages?with=${user.id}`,
      metadata: { message_id: data.id, sender_id: user.id },
    });

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
