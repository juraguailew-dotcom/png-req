import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../../../lib/supabase-server';
import { createNotification } from '../../../../../lib/utils/notifications';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: requisition } = await supabaseAdmin
      .from('requisitions')
      .select('assigned_shop_id, contractor_id, status')
      .eq('id', id)
      .single();

    if (!requisition || requisition.assigned_shop_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { items, total_amount, notes, valid_until } = body;

    if (!items || !Array.isArray(items) || items.length === 0 || !total_amount) {
      return NextResponse.json({ error: 'items and total_amount are required' }, { status: 400 });
    }

    // Store quotation as JSONB on the requisition row
    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .update({
        quotation: { items, total_amount, notes, valid_until, submitted_at: new Date().toISOString() },
        status: 'quoted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { data: shopUser } = await supabaseAdmin
      .from('users')
      .select('business_name, full_name')
      .eq('id', user.id)
      .single();

    const shopName = shopUser?.business_name || shopUser?.full_name || 'The shop';

    await createNotification({
      userId: requisition.contractor_id,
      type: 'quotation',
      title: 'Quotation Received',
      message: `${shopName} has sent a quotation for your requisition`,
      link: `/requisitions/${id}`,
      metadata: { requisition_id: id },
    });

    await logAudit(user, 'CREATE', 'quotation', id, { total_amount });

    return NextResponse.json({ requisition: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
