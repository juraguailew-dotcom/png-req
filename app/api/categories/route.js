import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return NextResponse.json({ categories: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
