import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';

export async function POST(request) {
  const caller = await getCallerUser();
  const allowedRoles = ['admin', 'hardware_shop'];
  if (!caller || !allowedRoles.includes(caller.app_metadata?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { user_id, message, requisition_id } = await request.json();
  if (!user_id || !message) return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('notifications').insert({ user_id, message, requisition_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Notification sent.' });
}
