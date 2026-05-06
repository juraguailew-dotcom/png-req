import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';

export async function GET() {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('favourites').select('*, product:product_id(*)').eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favourites: data });
}

export async function POST(request) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { product_id } = await request.json();
  // Toggle: remove if exists, add if not
  const { data: existing } = await supabaseAdmin.from('favourites').select('id').eq('user_id', user.id).eq('product_id', product_id).single();
  if (existing) {
    await supabaseAdmin.from('favourites').delete().eq('id', existing.id);
    return NextResponse.json({ favourited: false });
  }
  await supabaseAdmin.from('favourites').insert({ user_id: user.id, product_id });
  return NextResponse.json({ favourited: true });
}
