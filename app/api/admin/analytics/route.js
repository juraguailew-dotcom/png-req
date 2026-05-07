import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // User statistics
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    const { count: shopUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'hardware_shop');

    const { count: contractorUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'contractor');

    const { count: verifiedUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .eq('verified', true);

    // Requisition statistics
    const { count: totalRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' });

    const { count: fulfilledRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('status', 'fulfilled');

    const { count: pendingRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');

    // Revenue
    const { data: revenueData } = await supabaseAdmin
      .from('requisitions')
      .select('total_amount')
      .eq('status', 'fulfilled');

    const totalRevenue = revenueData?.reduce((sum, req) => sum + (req.total_amount || 0), 0) || 0;

    // Product statistics
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('active', true);

    const { data: lowStockProducts } = await supabaseAdmin
      .from('products')
      .select('*')
      .lt('stock', 10);

    // Dispute statistics
    const { count: openDisputes } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact' })
      .eq('status', 'open');

    // Monthly revenue trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyRevenueData } = await supabaseAdmin
      .from('requisitions')
      .select('total_amount, created_at')
      .eq('status', 'fulfilled')
      .gte('created_at', sixMonthsAgo.toISOString());

    const monthlyRevenue = {};
    monthlyRevenueData?.forEach(order => {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.total_amount;
    });

    // User growth (last 6 months by week)
    const weeklyUserGrowth = {};
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const { data: newUsers } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .gte('created_at', sixWeeksAgo.toISOString());

    newUsers?.forEach(user => {
      const week = new Date(user.created_at).toLocaleString('default', { month: 'short', day: 'numeric' });
      weeklyUserGrowth[week] = (weeklyUserGrowth[week] || 0) + 1;
    });

    // Top shops by revenue
    const { data: topShopsData } = await supabaseAdmin
      .from('requisitions')
      .select('assigned_shop_id, total_amount')
      .eq('status', 'fulfilled');

    const topShopsMap = {};
    topShopsData?.forEach(req => {
      if (req.assigned_shop_id) {
        topShopsMap[req.assigned_shop_id] = (topShopsMap[req.assigned_shop_id] || 0) + req.total_amount;
      }
    });

    const topShops = Object.entries(topShopsMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return NextResponse.json({
      users: {
        total: totalUsers,
        shops: shopUsers,
        contractors: contractorUsers,
        verified: verifiedUsers,
      },
      requisitions: {
        total: totalRequisitions,
        fulfilled: fulfilledRequisitions,
        pending: pendingRequisitions,
        fulfillmentRate: totalRequisitions > 0 ? ((fulfilledRequisitions / totalRequisitions) * 100).toFixed(2) : 0,
      },
      financials: {
        totalRevenue,
        averageOrderValue: fulfilledRequisitions > 0 ? (totalRevenue / fulfilledRequisitions).toFixed(2) : 0,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts?.length || 0,
      },
      disputes: {
        open: openDisputes,
      },
      trends: {
        monthlyRevenue,
        weeklyUserGrowth,
        topShops: topShops.map(([shopId, amount]) => ({ shopId, amount })),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
