import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { createNotification } from '../../../lib/utils/notifications';

export async function PATCH(request, { params }) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { status, resolution, admin_notes } = await request.json();

    if (!['open', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates = {
      status,
      admin_notes,
    };

    if (status === 'resolved' || status === 'dismissed') {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.id;
      updates.resolution = resolution;
    }

    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        requisition:requisition_id(id),
        raiser:raised_by(id, email, full_name)
      `)
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'dispute', id, { status, resolution });

    // Notify the person who raised the dispute
    await createNotification({
      userId: data.raised_by,
      type: 'dispute',
      title: `Dispute ${status}`,
      message: `Your dispute has been ${status}${resolution ? ': ' + resolution : ''}`,
      link: `/disputes/${id}`,
      metadata: { dispute_id: id, status },
    });

    return NextResponse.json({ dispute: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
