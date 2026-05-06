import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';

export async function GET() {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = user.app_metadata?.role;

  let query = supabaseAdmin.from('invoices').select('*, requisition:requisition_id(item_name, quantity)').order('created_at', { ascending: false });
  if (role === 'hardware_shop') query = query.eq('shop_id', user.id);
  else if (role === 'contractor') query = query.eq('contractor_id', user.id);
  // admin sees all

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data });
}

export async function POST(request) {
  const user = await getCallerUser();
  if (!user || user.app_metadata?.role !== 'hardware_shop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { requisition_id, contractor_id, items, total, notes } = await request.json();
  if (!requisition_id || !contractor_id || !items?.length) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('invoices').insert({
    requisition_id, shop_id: user.id, contractor_id, items, total: total || 0, notes,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'CREATE', 'invoice', data.id, { requisition_id, total });
  // Notify contractor
  await supabaseAdmin.from('notifications').insert({
    user_id: contractor_id,
    message: `A new invoice of K${total || 0} has been issued for your requisition.`,
    requisition_id,
  });
  return NextResponse.json({ invoice: data });
}
