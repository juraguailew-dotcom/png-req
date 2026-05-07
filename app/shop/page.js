'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Header from '../components/shared/Header';
import { formatCurrency } from '../lib/utils/currency';

export default function ShopPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, ordersRes, productsRes] = await Promise.all([
        fetch('/api/analytics?period=30'),
        fetch('/api/requisitions?limit=5'),
        fetch('/api/products?limit=100'),
      ]);

      const analyticsData = await analyticsRes.json();
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      setAnalytics(analyticsData.analytics);
      setRecentOrders(ordersData.requisitions || []);
      
      // Filter low stock products
      const lowStock = productsData.products?.filter(
        p => p.stock <= (p.low_stock_threshold || 10)
      ) || [];
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.app_metadata?.role !== 'hardware_shop') {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchDashboardData();
    };
    init();
  }, [router]);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Orders',
      value: analytics?.totalOrders || 0,
      icon: '📦',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Pending Orders',
      value: analytics?.pendingOrders || 0,
      icon: '⏳',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(analytics?.totalRevenue || 0),
      icon: '💰',
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Average Rating',
      value: analytics?.averageRating || '0.0',
      icon: '⭐',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-linear-to-r from-green-600 to-green-800 text-white rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Shop Dashboard</h1>
          <p className="text-green-100">Manage your products, orders, and inventory</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-3xl ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-orange-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">Low Stock Alert</h3>
                <p className="text-sm text-orange-800">
                  {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock.
                  <a href="/shop/inventory" className="ml-2 underline font-medium">View Inventory</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <a
            href="/shop/products"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition text-center"
          >
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-semibold">Manage Products</h3>
            <p className="text-sm text-blue-100 mt-1">Add, edit, or remove products</p>
          </a>

          <a
            href="/shop/orders"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition text-center"
          >
            <div className="text-3xl mb-2">🛒</div>
            <h3 className="font-semibold">View Orders</h3>
            <p className="text-sm text-green-100 mt-1">Fulfill customer orders</p>
          </a>

          <a
            href="/shop/analytics"
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm text-purple-100 mt-1">View sales and performance</p>
          </a>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <a href="/shop/orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </a>
          </div>

          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No orders yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.contractor_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.items?.length || 0} items</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full capitalize bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
