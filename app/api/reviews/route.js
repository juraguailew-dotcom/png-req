import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shop_id = searchParams.get('shop_id');
  let query = supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false });
  if (shop_id) query = query.eq('shop_id', shop_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

export async function POST(request) {
  const user = await getCallerUser();
  if (!user || user.app_metadata?.role !== 'contractor') {
    return NextResponse.json({ error: 'Only contractors can leave reviews.' }, { status: 403 });
  }
  const { requisition_id, shop_id, rating, comment } = await request.json();
  if (!requisition_id || !shop_id || !rating) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('reviews').insert({
    requisition_id, reviewer_id: user.id, shop_id, rating, comment,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit(user, 'CREATE', 'review', data.id, { shop_id, rating });
  return NextResponse.json({ review: data });
}
