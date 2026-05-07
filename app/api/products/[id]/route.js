import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { productSchema } from '../../../lib/utils/validation';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        shop:shop_id(id, email, full_name, business_name, city, latitude, longitude),
        category:category_id(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = productSchema.partial().parse(body);

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(validated)
      .eq('id', id)
      .eq('shop_id', user.id)
      .select(`
        *,
        shop:shop_id(id, email, full_name, business_name),
        category:category_id(id, name)
      `)
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'product', id, validated);
    return NextResponse.json({ product: data });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete by setting active to false
    const { error } = await supabaseAdmin
      .from('products')
      .update({ active: false })
      .eq('id', id)
      .eq('shop_id', user.id);

    if (error) throw error;

    await logAudit(user, 'DELETE', 'product', id);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
