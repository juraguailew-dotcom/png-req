import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../../lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, category:category_id(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user is owner or is admin
    if (user?.id !== data.shop_id && user?.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownership
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('shop_id')
      .eq('id', id)
      .single();

    if (!product || product.shop_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, category_id, pricing_method, unit_price, unit, stock, low_stock_threshold, active } = body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category_id && { category_id }),
        ...(pricing_method && { pricing_method }),
        ...(unit_price !== undefined && { unit_price }),
        ...(unit && { unit }),
        ...(stock !== undefined && { stock }),
        ...(low_stock_threshold !== undefined && { low_stock_threshold }),
        ...(active !== undefined && { active }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, category:category_id(id, name)')
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'product', id, { name: data.name });

    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownership
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('shop_id, name')
      .eq('id', id)
      .single();

    if (!product || product.shop_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAudit(user, 'DELETE', 'product', id, { name: product.name });

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
