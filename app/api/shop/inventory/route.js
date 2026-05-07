import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, low_stock, out_of_stock
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select('*, category:category_id(name)', { count: 'exact' })
      .eq('shop_id', user.id)
      .order('stock', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status === 'low_stock') {
      query = query.lte('stock', 10);
    } else if (status === 'out_of_stock') {
      query = query.eq('stock', 0);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      inventory: data,
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

export async function PUT(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { product_id, stock, operation } = body; // operation: 'set', 'add', 'subtract'

    if (!product_id || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('shop_id, stock')
      .eq('id', product_id)
      .single();

    if (!product || product.shop_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    let newStock = stock;
    if (operation === 'add') {
      newStock = product.stock + stock;
    } else if (operation === 'subtract') {
      newStock = product.stock - stock;
      if (newStock < 0) newStock = 0;
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product_id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE_STOCK', 'product', product_id, {
      operation,
      previous_stock: product.stock,
      new_stock: newStock,
    });

    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
