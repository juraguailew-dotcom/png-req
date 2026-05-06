import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';

export async function PATCH(request, { params }) {
  const user = await getCallerUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const { status, resolution } = await request.json();
  const allowed = ['Resolved', 'Dismissed'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('disputes').update({
    status, resolution, resolved_at: new Date().toISOString(),
    resolved_by: user.user_metadata?.full_name || user.email,
  }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'RESOLVE', 'dispute', id, { status, resolution });
  return NextResponse.json({ dispute: data });
}
