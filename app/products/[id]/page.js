'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function ProductDetailPage() {
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchProduct();
    };
    init();
  }, [router, params.id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${params.id}`);
      const data = await res.json();
      setProduct(data.product || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavourite = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      await fetchProduct();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">Product not found.</p>
            <a href="/products" className="mt-4 inline-block text-blue-600 hover:underline">Back to products</a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 mt-2">{product.category?.name || 'General'}</p>
          </div>
          <a href="/products" className="text-blue-600 hover:text-blue-800">Back to products</a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="bg-gray-100 h-64 rounded-lg mb-6 flex items-center justify-center text-gray-400">No image</div>
            <p className="text-gray-700 leading-relaxed">{product.description || 'No description available.'}</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold text-gray-900">Unit:</span> {product.unit || 'Each'}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Stock:</span> {product.stock ?? 'N/A'}
              </div>
              <div>
                <span className="font-semibold text-gray-900">Shop:</span> {product.shop?.business_name || product.shop?.full_name || 'Unknown'}</div>
              <div>
                <span className="font-semibold text-gray-900">City:</span> {product.shop?.city || 'Unknown'}
              </div>
            </div>
          </div>

          <aside className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(product.unit_price)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-gray-700">
              <p className="font-semibold">Availability</p>
              <p>{product.stock > 0 ? 'In stock' : 'Out of stock'}</p>
            </div>
            <button
              onClick={toggleFavourite}
              disabled={saving}
              className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Save to Favourites'}
            </button>
            <a
              href={`/messages?with=${product.shop?.id}`}
              className="block text-center px-4 py-3 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Message Shop
            </a>
          </aside>
        </div>
      </main>
    </div>
  );
}
