import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { productSchema } from '../../../lib/utils/validation';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'active'; // active, inactive, low_stock
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select('*, category:category_id(id, name)', { count: 'exact' })
      .eq('shop_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'active') {
      query = query.eq('active', true);
    } else if (status === 'inactive') {
      query = query.eq('active', false);
    } else if (status === 'low_stock') {
      query = query.lt('stock', query.low_stock_threshold || 10);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      products: data,
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

export async function POST(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = productSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        ...validated,
        shop_id: user.id,
      })
      .select('*, category:category_id(id, name)')
      .single();

    if (error) throw error;

    await logAudit(user, 'CREATE', 'product', data.id, { name: data.name });

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
