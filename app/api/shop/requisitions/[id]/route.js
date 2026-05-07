import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../../lib/supabase-server';
import { createNotification } from '../../../../lib/utils/notifications';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .select(`
        *,
        contractor:contractor_id(id, email, full_name, business_name, phone, address),
        shop:assigned_shop_id(id, email, full_name, business_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
    }

    // Verify access
    const role = user.app_metadata?.role;
    if (role === 'contractor' && data.contractor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (role === 'hardware_shop' && data.assigned_shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ requisition: data });
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

    // Verify shop owns the requisition
    const { data: requisition } = await supabaseAdmin
      .from('requisitions')
      .select('assigned_shop_id, status, contractor_id')
      .eq('id', id)
      .single();

    if (!requisition || requisition.assigned_shop_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { status, fulfillment_notes } = body;

    const validStatuses = ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .update({
        status: status || requisition.status,
        fulfilled_by: status === 'fulfilled' ? user.id : null,
        fulfilled_at: status === 'fulfilled' ? new Date().toISOString() : null,
        fulfillment_notes: fulfillment_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify contractor
    await createNotification(
      requisition.contractor_id,
      'requisition',
      `Order ${status === 'fulfilled' ? 'Fulfilled' : status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your requisition has been ${status}`,
      `/requisitions/${id}`
    );

    await logAudit(user, 'UPDATE', 'requisition', id, { status });

    return NextResponse.json({ requisition: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
