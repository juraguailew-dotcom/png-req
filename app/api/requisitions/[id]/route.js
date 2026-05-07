import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { createNotification } from '../../../lib/utils/notifications';

export async function GET(request, { params }) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .select(`
        *,
        contractor:contractor_id(id, email, full_name, phone),
        shop:assigned_shop_id(id, email, full_name, business_name, phone),
        approver:approved_by(id, email, full_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check access
    const role = user.app_metadata?.role;
    if (
      role === 'contractor' && data.contractor_id !== user.id ||
      role === 'hardware_shop' && data.assigned_shop_id !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ requisition: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const role = user.app_metadata?.role;

    // Get current requisition
    const { data: current } = await supabaseAdmin
      .from('requisitions')
      .select('*')
      .eq('id', id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let updates = {};

    // Admin can approve/reject
    if (role === 'admin' && body.action === 'approve') {
      updates = {
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_comment: body.comment,
      };

      await createNotification({
        userId: current.contractor_id,
        type: 'requisition',
        title: 'Requisition Approved',
        message: `Your requisition has been approved`,
        link: `/requisitions/${id}`,
        metadata: { requisition_id: id },
      });
    } else if (role === 'admin' && body.action === 'reject') {
      updates = {
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_comment: body.comment,
      };

      await createNotification({
        userId: current.contractor_id,
        type: 'requisition',
        title: 'Requisition Rejected',
        message: `Your requisition has been rejected: ${body.comment}`,
        link: `/requisitions/${id}`,
        metadata: { requisition_id: id },
      });
    }
    // Admin can assign to shop
    else if (role === 'admin' && body.action === 'assign') {
      const { data: shop } = await supabaseAdmin
        .from('users')
        .select('full_name, business_name')
        .eq('id', body.shop_id)
        .single();

      updates = {
        assigned_shop_id: body.shop_id,
        assigned_shop_name: shop?.business_name || shop?.full_name,
      };

      await createNotification({
        userId: body.shop_id,
        type: 'requisition',
        title: 'New Requisition Assigned',
        message: `A new requisition has been assigned to you`,
        link: `/shop/requisitions/${id}`,
        metadata: { requisition_id: id },
      });
    }
    // Shop can fulfill
    else if (role === 'hardware_shop' && body.action === 'fulfill' && current.assigned_shop_id === user.id) {
      updates = {
        status: 'fulfilled',
        fulfilled_by: user.id,
        fulfilled_at: new Date().toISOString(),
        fulfillment_notes: body.notes,
      };

      await createNotification({
        userId: current.contractor_id,
        type: 'requisition',
        title: 'Requisition Fulfilled',
        message: `Your requisition has been fulfilled`,
        link: `/requisitions/${id}`,
        metadata: { requisition_id: id },
      });
    }
    // Contractor can cancel pending
    else if (role === 'contractor' && body.action === 'cancel' && current.contractor_id === user.id && current.status === 'pending') {
      updates = { status: 'cancelled' };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'requisition', id, { action: body.action, ...updates });

    return NextResponse.json({ requisition: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
