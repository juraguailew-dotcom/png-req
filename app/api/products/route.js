import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  let query = supabaseAdmin.from('products').select('*, shop:shop_id(id, email, user_metadata)').order('name');
  if (search) query = query.ilike('name', `%${search}%`);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(request) {
  const user = await getCallerUser();
  if (!user || user.app_metadata?.role !== 'hardware_shop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const { name, description, unit, price, stock, category } = body;
  if (!name) return NextResponse.json({ error: 'Name required.' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('products').insert({
    name, description, unit, price, stock, category, shop_id: user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'CREATE', 'product', data.id, { name });
  return NextResponse.json({ product: data });
}
