import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';

export async function PATCH(request, { params }) {
  const user = await getCallerUser();
  if (!user || user.app_metadata?.role !== 'hardware_shop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('products').update(body).eq('id', id).eq('shop_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'UPDATE', 'product', id, body);
  return NextResponse.json({ product: data });
}

export async function DELETE(request, { params }) {
  const user = await getCallerUser();
  if (!user || user.app_metadata?.role !== 'hardware_shop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id).eq('shop_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'DELETE', 'product', id);
  return NextResponse.json({ message: 'Deleted.' });
}
