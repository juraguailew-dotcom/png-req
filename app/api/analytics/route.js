import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser } from '../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let analytics = {};

    if (role === 'contractor') {
      // Contractor Analytics
      const { data: requisitions } = await supabaseAdmin
        .from('requisitions')
        .select('*')
        .eq('contractor_id', user.id)
        .gte('created_at', startDate.toISOString());

      const totalSpent = requisitions
        ?.filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) || 0;

      const { data: favouriteShops } = await supabaseAdmin
        .from('favourites')
        .select('shop_id')
        .eq('user_id', user.id)
        .not('shop_id', 'is', null);

      analytics = {
        totalRequisitions: requisitions?.length || 0,
        pendingRequisitions: requisitions?.filter(r => r.status === 'pending').length || 0,
        approvedRequisitions: requisitions?.filter(r => r.status === 'approved').length || 0,
        fulfilledRequisitions: requisitions?.filter(r => r.status === 'fulfilled').length || 0,
        totalSpent,
        averageOrderValue: requisitions?.length ? totalSpent / requisitions.filter(r => r.status === 'fulfilled').length : 0,
        favouriteShopsCount: favouriteShops?.length || 0,
        spendingByMonth: await getSpendingByMonth(user.id, startDate),
      };
    } else if (role === 'hardware_shop') {
      // Shop Analytics
      const { data: requisitions } = await supabaseAdmin
        .from('requisitions')
        .select('*')
        .eq('assigned_shop_id', user.id)
        .gte('created_at', startDate.toISOString());

      const totalRevenue = requisitions
        ?.filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) || 0;

      const { data: products } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('shop_id', user.id);

      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', user.id);

      const averageRating = reviews?.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      const { data: lowStockProducts } = await supabaseAdmin
        .from('products')
        .select('id, name, stock, low_stock_threshold')
        .eq('shop_id', user.id)
        .lte('stock', supabaseAdmin.raw('low_stock_threshold'));

      analytics = {
        totalOrders: requisitions?.length || 0,
        pendingOrders: requisitions?.filter(r => r.status === 'approved').length || 0,
        fulfilledOrders: requisitions?.filter(r => r.status === 'fulfilled').length || 0,
        totalRevenue,
        averageOrderValue: requisitions?.length ? totalRevenue / requisitions.filter(r => r.status === 'fulfilled').length : 0,
        totalProducts: products?.length || 0,
        activeProducts: products?.filter(p => p.active).length || 0,
        lowStockProducts: lowStockProducts?.length || 0,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews?.length || 0,
        revenueByMonth: await getRevenueByMonth(user.id, startDate),
        topProducts: await getTopProducts(user.id, startDate),
      };
    } else if (role === 'admin') {
      // Admin Analytics
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('role, verified, created_at');

      const { data: requisitions } = await supabaseAdmin
        .from('requisitions')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const totalRevenue = requisitions
        ?.filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) || 0;

      const { data: disputes } = await supabaseAdmin
        .from('disputes')
        .select('status')
        .gte('created_at', startDate.toISOString());

      analytics = {
        totalUsers: users?.length || 0,
        totalContractors: users?.filter(u => u.role === 'contractor').length || 0,
        totalShops: users?.filter(u => u.role === 'hardware_shop').length || 0,
        verifiedUsers: users?.filter(u => u.verified).length || 0,
        totalRequisitions: requisitions?.length || 0,
        pendingApprovals: requisitions?.filter(r => r.requires_approval && r.status === 'pending').length || 0,
        totalRevenue,
        openDisputes: disputes?.filter(d => d.status === 'open').length || 0,
        userGrowth: await getUserGrowth(startDate),
        revenueByMonth: await getPlatformRevenueByMonth(startDate),
        topShops: await getTopShops(startDate),
        topContractors: await getTopContractors(startDate),
      };
    }

    return NextResponse.json({ analytics });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getSpendingByMonth(contractorId, startDate) {
  const { data } = await supabaseAdmin
    .from('requisitions')
    .select('created_at, total_amount')
    .eq('contractor_id', contractorId)
    .eq('status', 'fulfilled')
    .gte('created_at', startDate.toISOString())
    .order('created_at');

  const byMonth = {};
  data?.forEach(r => {
    const month = new Date(r.created_at).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + parseFloat(r.total_amount || 0);
  });

  return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
}

async function getRevenueByMonth(shopId, startDate) {
  const { data } = await supabaseAdmin
    .from('requisitions')
    .select('created_at, total_amount')
    .eq('assigned_shop_id', shopId)
    .eq('status', 'fulfilled')
    .gte('created_at', startDate.toISOString())
    .order('created_at');

  const byMonth = {};
  data?.forEach(r => {
    const month = new Date(r.created_at).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + parseFloat(r.total_amount || 0);
  });

  return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
}

async function getPlatformRevenueByMonth(startDate) {
  const { data } = await supabaseAdmin
    .from('requisitions')
    .select('created_at, total_amount')
    .eq('status', 'fulfilled')
    .gte('created_at', startDate.toISOString())
    .order('created_at');

  const byMonth = {};
  data?.forEach(r => {
    const month = new Date(r.created_at).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + parseFloat(r.total_amount || 0);
  });

  return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
}

async function getTopProducts(shopId, startDate) {
  // This would require parsing items from requisitions
  // Simplified version - return empty for now
  return [];
}

async function getUserGrowth(startDate) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at');

  const byMonth = {};
  data?.forEach(u => {
    const month = new Date(u.created_at).toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  return Object.entries(byMonth).map(([month, count]) => ({ month, count }));
}

async function getTopShops(startDate) {
  const { data } = await supabaseAdmin
    .from('requisitions')
    .select('assigned_shop_id, assigned_shop_name, total_amount')
    .eq('status', 'fulfilled')
    .not('assigned_shop_id', 'is', null)
    .gte('created_at', startDate.toISOString());

  const byShop = {};
  data?.forEach(r => {
    const shopId = r.assigned_shop_id;
    if (!byShop[shopId]) {
      byShop[shopId] = {
        shop_id: shopId,
        shop_name: r.assigned_shop_name,
        total_revenue: 0,
        order_count: 0,
      };
    }
    byShop[shopId].total_revenue += parseFloat(r.total_amount || 0);
    byShop[shopId].order_count += 1;
  });

  return Object.values(byShop)
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10);
}

async function getTopContractors(startDate) {
  const { data } = await supabaseAdmin
    .from('requisitions')
    .select('contractor_id, contractor_name, total_amount')
    .eq('status', 'fulfilled')
    .gte('created_at', startDate.toISOString());

  const byContractor = {};
  data?.forEach(r => {
    const contractorId = r.contractor_id;
    if (!byContractor[contractorId]) {
      byContractor[contractorId] = {
        contractor_id: contractorId,
        contractor_name: r.contractor_name,
        total_spent: 0,
        order_count: 0,
      };
    }
    byContractor[contractorId].total_spent += parseFloat(r.total_amount || 0);
    byContractor[contractorId].order_count += 1;
  });

  return Object.values(byContractor)
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 10);
}
