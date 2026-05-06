import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';

export async function PATCH(request, { params }) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  const allowed = ['Paid', 'Cancelled'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

  // Contractor can mark Paid, shop can mark Cancelled
  const role = user.app_metadata?.role;
  const field = role === 'hardware_shop' ? 'shop_id' : 'contractor_id';
  const { data, error } = await supabaseAdmin.from('invoices').update({ status }).eq('id', id).eq(field, user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'UPDATE_STATUS', 'invoice', id, { status });
  return NextResponse.json({ invoice: data });
}
