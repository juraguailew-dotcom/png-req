import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';
import { reviewSchema } from '../../lib/utils/validation';
import { createNotification } from '../../lib/utils/notifications';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get('reviewee_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('reviews')
      .select(`
        *,
        reviewer:reviewer_id(id, email, full_name),
        reviewee:reviewee_id(id, email, full_name, business_name),
        requisition:requisition_id(id, total_amount)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (revieweeId) query = query.eq('reviewee_id', revieweeId);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      reviews: data,
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = reviewSchema.parse(body);

    // Verify requisition is fulfilled and user is part of it
    const { data: requisition } = await supabaseAdmin
      .from('requisitions')
      .select('status, contractor_id, assigned_shop_id')
      .eq('id', validated.requisition_id)
      .single();

    if (!requisition || requisition.status !== 'fulfilled') {
      return NextResponse.json({ error: 'Can only review fulfilled requisitions' }, { status: 400 });
    }

    if (requisition.contractor_id !== user.id && requisition.assigned_shop_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to review this requisition' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        ...validated,
        reviewer_id: user.id,
      })
      .select(`
        *,
        reviewer:reviewer_id(id, email, full_name),
        reviewee:reviewee_id(id, email, full_name, business_name)
      `)
      .single();

    if (error) throw error;

    await logAudit(user, 'CREATE', 'review', data.id, { rating: validated.rating });

    // Notify reviewee
    await createNotification({
      userId: validated.reviewee_id,
      type: 'review',
      title: 'New Review Received',
      message: `You received a ${validated.rating}-star review`,
      link: `/reviews`,
      metadata: { review_id: data.id, rating: validated.rating },
    });

    return NextResponse.json({ review: data }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
