import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('requisitions')
      .select(`
        *,
        contractor:contractor_id(id, email, full_name, business_name),
        shop:assigned_shop_id(id, email, full_name, business_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      requisitions: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
