'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function ShopOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.app_metadata?.role !== 'hardware_shop') {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchOrders(user.id);
    };
    init();
  }, [router]);

  const fetchOrders = async (shopId) => {
    setLoading(true);
    try {
      const url = new URL('/api/requisitions', window.location.origin);
      url.searchParams.set('assigned_shop_id', shopId);
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.requisitions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">View incoming requisitions assigned to your shop.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">No orders assigned yet.</p>
            <p className="text-sm text-gray-500 mt-2">Once a contractor places a request, it will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Request', 'Contractor', 'Items', 'Total', 'Status', 'Placed'].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-semibold text-gray-900">#{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-4 text-gray-600">{order.contractor_name || 'Unknown'}</td>
                      <td className="px-4 py-4 text-gray-600">{order.items?.length || 0}</td>
                      <td className="px-4 py-4 text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'fulfilled' ? 'bg-green-100 text-green-700' : order.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
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
