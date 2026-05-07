import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';
import { disputeSchema } from '../../lib/utils/validation';
import { createNotification } from '../../lib/utils/notifications';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const role = user.app_metadata?.role;

    let query = supabaseAdmin
      .from('disputes')
      .select(`
        *,
        requisition:requisition_id(id, total_amount, contractor_id, assigned_shop_id),
        raiser:raised_by(id, email, full_name),
        resolver:resolved_by(id, email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role !== 'admin') {
      query = query.eq('raised_by', user.id);
    }

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

export async function POST(request) {
  try {
    const user = await getCallerUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = disputeSchema.parse(body);

    // Verify user is part of the requisition
    const { data: requisition } = await supabaseAdmin
      .from('requisitions')
      .select('contractor_id, assigned_shop_id')
      .eq('id', validated.requisition_id)
      .single();

    if (!requisition) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
    }

    if (requisition.contractor_id !== user.id && requisition.assigned_shop_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to dispute this requisition' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('disputes')
      .insert({
        ...validated,
        raised_by: user.id,
      })
      .select(`
        *,
        requisition:requisition_id(id, total_amount),
        raiser:raised_by(id, email, full_name)
      `)
      .single();

    if (error) throw error;

    await logAudit(user, 'CREATE', 'dispute', data.id, { requisition_id: validated.requisition_id });

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin');

    for (const admin of admins || []) {
      await createNotification({
        userId: admin.id,
        type: 'dispute',
        title: 'New Dispute Raised',
        message: `A dispute has been raised for requisition ${validated.requisition_id}`,
        link: `/admin/disputes/${data.id}`,
        metadata: { dispute_id: data.id },
      });
    }

    return NextResponse.json({ dispute: data }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
