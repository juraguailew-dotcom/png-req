'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function FavouritesPage() {
  const [user, setUser] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchFavourites();
    };
    init();
  }, [router]);

  const fetchFavourites = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/favourites');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load favourites');
      setFavourites(data.favourites || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavourite = async (productId) => {
    try {
      await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });
      fetchFavourites();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Favourites</h1>
          <p className="text-gray-600 mt-1">Saved products you can request again.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-sm text-gray-600">
            Keep the products you frequently use close by. Remove items you no longer need or continue browsing for more.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Loading favourites...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">Error: {error}</div>
        ) : favourites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700 text-lg">No favourites yet.</p>
            <p className="text-gray-500 mt-2">Browse products and save the ones you want to revisit.</p>
            <a href="/products" className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
              Browse Products
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favourites.map((fav) => {
              const product = fav.product;
              if (!product) return null;
              return (
                <div key={fav.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                  <div className="bg-gray-100 h-44 flex items-center justify-center text-gray-400">No image</div>
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h2>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description || 'Product details are unavailable.'}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-blue-600 font-bold">{formatCurrency(product.unit_price)}</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <a href={`/products/${product.id}`} className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        View
                      </a>
                      <button
                        onClick={() => toggleFavourite(product.id)}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
