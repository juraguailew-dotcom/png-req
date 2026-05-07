import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { createNotification } from '../../../lib/utils/notifications';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('disputes')
      .select(`
        *,
        raised_by_user:raised_by(id, email, full_name),
        resolved_by_user:resolved_by(id, email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      disputes: data,
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
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { dispute_id, status, resolution, admin_notes } = body;

    if (!dispute_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status,
        resolution: status === 'resolved' ? resolution : null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        resolved_by: status === 'resolved' ? user.id : null,
        admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispute_id)
      .select()
      .single();

    if (error) throw error;

    // Notify the person who raised the dispute
    await createNotification(
      data.raised_by,
      'dispute',
      `Dispute ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your dispute has been marked as ${status}`,
      `/admin/disputes/${dispute_id}`
    );

    await logAudit(user, 'UPDATE', 'dispute', dispute_id, { status, resolution });

    return NextResponse.json({ dispute: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
