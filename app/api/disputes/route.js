import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';

export async function GET() {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = user.app_metadata?.role;
  let query = supabaseAdmin.from('disputes').select('*, requisition:requisition_id(item_name)').order('created_at', { ascending: false });
  if (role !== 'admin') query = query.eq('raised_by', user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ disputes: data });
}

export async function POST(request) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { requisition_id, reason } = await request.json();
  if (!requisition_id || !reason?.trim()) return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('disputes').insert({
    requisition_id, raised_by: user.id, reason: reason.trim(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'CREATE', 'dispute', data.id, { requisition_id });
  return NextResponse.json({ dispute: data });
}
