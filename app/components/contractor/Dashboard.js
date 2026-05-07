'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function ContractorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentRequisitions, setRecentRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, requisitionsRes] = await Promise.all([
        fetch('/api/analytics?period=30'),
        fetch('/api/requisitions?limit=5'),
      ]);

      const analyticsData = await analyticsRes.json();
      const requisitionsData = await requisitionsRes.json();

      setAnalytics(analyticsData.analytics);
      setRecentRequisitions(requisitionsData.requisitions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Requisitions',
      value: analytics?.totalRequisitions || 0,
      icon: '📋',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Pending',
      value: analytics?.pendingRequisitions || 0,
      icon: '⏳',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Fulfilled',
      value: analytics?.fulfilledRequisitions || 0,
      icon: '✅',
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Spent',
      value: formatCurrency(analytics?.totalSpent || 0),
      icon: '💰',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      fulfilled: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-blue-100">Manage your requisitions and track your spending</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/requisitions/new"
          className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition text-center"
        >
          <div className="text-3xl mb-2">➕</div>
          <h3 className="font-semibold">Create Requisition</h3>
          <p className="text-sm text-blue-100 mt-1">Start a new purchase request</p>
        </a>

        <a
          href="/products"
          className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition text-center"
        >
          <div className="text-3xl mb-2">🛒</div>
          <h3 className="font-semibold">Browse Products</h3>
          <p className="text-sm text-green-100 mt-1">Find what you need</p>
        </a>

        <a
          href="/shops"
          className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition text-center"
        >
          <div className="text-3xl mb-2">🏪</div>
          <h3 className="font-semibold">Find Shops</h3>
          <p className="text-sm text-purple-100 mt-1">Locate nearby hardware shops</p>
        </a>
      </div>

      {/* Recent Requisitions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recent Requisitions</h2>
          <a href="/requisitions" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All →
          </a>
        </div>

        <div className="overflow-x-auto">
          {recentRequisitions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No requisitions yet</p>
              <a href="/requisitions/new" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                Create your first requisition
              </a>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentRequisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      #{req.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {req.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(req.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={`/requisitions/${req.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Spending Chart Placeholder */}
      {analytics?.spendingByMonth && analytics.spendingByMonth.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Spending</h2>
          <div className="h-64 flex items-end justify-around space-x-2">
            {analytics.spendingByMonth.map((item, index) => {
              const maxAmount = Math.max(...analytics.spendingByMonth.map(i => i.amount));
              const height = (item.amount / maxAmount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    {formatCurrency(item.amount)}
                  </div>
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2">
                    {new Date(item.month).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
