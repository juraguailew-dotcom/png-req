'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function ShopProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
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
      fetchProducts(user.id);
    };
    init();
  }, [router]);

  const fetchProducts = async (shopId) => {
    setLoading(true);
    try {
      const url = new URL('/api/products', window.location.origin);
      url.searchParams.set('shop_id', shopId);
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">View and manage items listed by your shop.</p>
          </div>
          <a href="/shop/products/new" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
            Add Product
          </a>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">No products found for your shop.</p>
            <p className="text-sm text-gray-500 mt-2">Add products to make them available to contractors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-5">
                <div className="bg-gray-100 h-40 rounded-lg mb-5 flex items-center justify-center text-gray-400">No image</div>
                <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description || 'No description provided.'}</p>
                <div className="mt-4 flex items-center justify-between text-gray-800">
                  <span className="font-bold">{formatCurrency(product.unit_price)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock} in stock
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <a href={`/products/${product.id}`} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-center hover:bg-blue-700">View</a>
                  <a href={`/shop/products/${product.id}/edit`} className="flex-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-center hover:bg-gray-200">Edit</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
