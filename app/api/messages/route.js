import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';

export async function GET(request) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const with_user = searchParams.get('with');

  let query = supabaseAdmin.from('messages').select('*').order('created_at', { ascending: true });
  if (with_user) {
    query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${with_user}),and(sender_id.eq.${with_user},receiver_id.eq.${user.id})`);
  } else {
    query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark received messages as read
  const unread = (data || []).filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
  if (unread.length) await supabaseAdmin.from('messages').update({ read: true }).in('id', unread);

  return NextResponse.json({ messages: data });
}

export async function POST(request) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { receiver_id, content, requisition_id } = await request.json();
  if (!receiver_id || !content?.trim()) return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('messages').insert({
    sender_id: user.id, receiver_id, content: content.trim(), requisition_id: requisition_id || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
