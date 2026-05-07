import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';
import { requisitionSchema } from '../../lib/utils/validation';
import { createNotification } from '../../lib/utils/notifications';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('requisitions')
      .select(`
        *,
        contractor:contractor_id(id, email, full_name),
        shop:assigned_shop_id(id, email, full_name, business_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const role = user.app_metadata?.role;

    if (role === 'contractor') {
      query = query.eq('contractor_id', user.id);
    } else if (role === 'hardware_shop') {
      query = query.eq('assigned_shop_id', user.id);
    }
    // Admin sees all

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      requisitions: data,
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
    if (!user || user.app_metadata?.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = requisitionSchema.parse(body);

    // Calculate total
    const total = validated.items.reduce((sum, item) => sum + item.total, 0);

    // Get contractor name
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('requisitions')
      .insert({
        contractor_id: user.id,
        contractor_name: userData?.full_name || user.email,
        items: validated.items,
        total_amount: total,
        notes: validated.notes,
        template_id: validated.template_id,
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'CREATE', 'requisition', data.id, { total });

    // Notify admins if approval required
    if (data.requires_approval) {
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin');

      for (const admin of admins || []) {
        await createNotification({
          userId: admin.id,
          type: 'requisition',
          title: 'New Requisition Requires Approval',
          message: `Requisition ${data.id} for K${total.toFixed(2)} requires approval`,
          link: `/admin/requisitions/${data.id}`,
          metadata: { requisition_id: data.id, total },
        });
      }
    }

    return NextResponse.json({ requisition: data }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
