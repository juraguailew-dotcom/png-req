import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'hardware_shop') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get shop info
    const { data: shopData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get total products
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('shop_id', user.id)
      .eq('active', true);

    // Get low stock products
    const { data: lowStockProducts } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('shop_id', user.id)
      .lt('stock', 10);

    // Get requisitions stats
    const { count: pendingRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('assigned_shop_id', user.id)
      .eq('status', 'pending');

    const { count: fulfilledRequisitions } = await supabaseAdmin
      .from('requisitions')
      .select('*', { count: 'exact' })
      .eq('assigned_shop_id', user.id)
      .eq('status', 'fulfilled');

    // Get revenue
    const { data: revenueData } = await supabaseAdmin
      .from('requisitions')
      .select('total_amount')
      .eq('assigned_shop_id', user.id)
      .eq('status', 'fulfilled');

    const totalRevenue = revenueData?.reduce((sum, req) => sum + (req.total_amount || 0), 0) || 0;

    // Get average rating
    const { data: ratings } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', user.id);

    const averageRating = ratings?.length > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2) 
      : 0;

    // Get recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('requisitions')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        contractor:contractor_id(full_name)
      `)
      .eq('assigned_shop_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyData } = await supabaseAdmin
      .from('requisitions')
      .select('total_amount, created_at')
      .eq('assigned_shop_id', user.id)
      .eq('status', 'fulfilled')
      .gte('created_at', sixMonthsAgo.toISOString());

    // Group by month
    const monthlyRevenue = {};
    monthlyData?.forEach(order => {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.total_amount;
    });

    return NextResponse.json({
      shop: shopData,
      metrics: {
        totalProducts,
        lowStockCount: lowStockProducts?.length || 0,
        pendingRequisitions,
        fulfilledRequisitions,
        totalRevenue,
        averageRating: parseFloat(averageRating),
        reviewCount: ratings?.length || 0,
      },
      recentOrders,
      monthlyRevenue,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
