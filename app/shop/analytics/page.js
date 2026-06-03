'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function ShopAnalyticsPage() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      try {
        const res = await fetch('/api/shop/analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (_) {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  const metrics = analytics?.metrics || {};
  const recentOrders = analytics?.recentOrders || [];
  const monthlyRevenue = analytics?.monthlyRevenue || {};

  const stats = [
    { label: 'Total Products', value: metrics.totalProducts ?? 0, color: 'bg-blue-100 text-blue-600' },
    { label: 'Low Stock Items', value: metrics.lowStockCount ?? 0, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Pending Requests', value: metrics.pendingRequisitions ?? 0, color: 'bg-orange-100 text-orange-600' },
    { label: 'Fulfilled Orders', value: metrics.fulfilledRequisitions ?? 0, color: 'bg-green-100 text-green-600' },
    { label: 'Total Revenue', value: formatCurrency(metrics.totalRevenue ?? 0), color: 'bg-purple-100 text-purple-600', isText: true },
    { label: 'Average Rating', value: metrics.averageRating ? `${metrics.averageRating} ⭐` : 'N/A', color: 'bg-indigo-100 text-indigo-600', isText: true },
  ];

  const monthEntries = Object.entries(monthlyRevenue);
  const maxRevenue = monthEntries.length > 0 ? Math.max(...monthEntries.map(([, v]) => v)) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop Analytics</h1>
          <p className="text-gray-600 mt-1">Your shop performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.isText ? 'text-gray-900' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Monthly Revenue Chart */}
        {monthEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
            <div className="h-48 flex items-end justify-around gap-2">
              {monthEntries.map(([month, amount]) => {
                const height = maxRevenue > 0 ? (amount / maxRevenue) * 100 : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-gray-700 mb-1">{formatCurrency(amount)}</span>
                    <div className="w-full bg-green-500 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-xs text-gray-500 mt-2 text-center">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <a href="/shop/orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All →</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Order', 'Contractor', 'Total', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">#{order.id?.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-gray-600">{order.contractor?.full_name || '—'}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
