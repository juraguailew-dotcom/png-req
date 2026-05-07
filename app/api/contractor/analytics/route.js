import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get requisitions stats
    const { count: totalRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('contractor_id', user.id);

    const { count: pendingRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('contractor_id', user.id)
      .eq('status', 'pending');

    const { count: fulfilledRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('contractor_id', user.id)
      .eq('status', 'fulfilled');

    // Calculate spending
    const { data: requisitionData } = await supabaseAdmin
      .from('requisitions')
      .select('total_amount')
      .eq('contractor_id', user.id)
      .eq('status', 'fulfilled');

    const totalSpent = requisitionData?.reduce((sum, req) => sum + (req.total_amount || 0), 0) || 0;
    const averageOrderValue = fulfilledRequisitions > 0 ? (totalSpent / fulfilledRequisitions).toFixed(2) : 0;

    // Get favorite shops
    const { data: favoriteShops } = await supabaseAdmin
      .from('favourites')
      .select(`
        id,
        shop_id,
        shop:shop_id(id, business_name, email)
      `)
      .eq('user_id', user.id)
      .not('shop_id', 'is', null);

    // Get recent requisitions
    const { data: recentRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        shop:assigned_shop_id(business_name)
      `)
      .eq('contractor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get monthly spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData } = await supabaseAdmin
      .from('requisitions')
      .select('total_amount, created_at')
      .eq('contractor_id', user.id)
      .eq('status', 'fulfilled')
      .gte('created_at', sixMonthsAgo.toISOString());

    // Group by month
    const monthlySpending = {};
    monthlyData?.forEach(order => {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlySpending[month] = (monthlySpending[month] || 0) + order.total_amount;
    });

    // Get top shops
    const { data: topShopsData } = await supabaseAdmin
      .from('requisitions')
      .select('assigned_shop_id, total_amount')
      .eq('contractor_id', user.id)
      .eq('status', 'fulfilled');

    const topShopsMap = {};
    topShopsData?.forEach(req => {
      topShopsMap[req.assigned_shop_id] = (topShopsMap[req.assigned_shop_id] || 0) + req.total_amount;
    });

    const topShops = Object.entries(topShopsMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return NextResponse.json({
      metrics: {
        totalRequisitions,
        pendingRequisitions,
        fulfilledRequisitions,
        totalSpent,
        averageOrderValue: parseFloat(averageOrderValue),
        favoriteShopsCount: favoriteShops?.length || 0,
      },
      recentRequisitions,
      monthlySpending,
      topShops: topShops.map(([shopId, amount]) => ({ shopId, amount })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
