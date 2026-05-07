'use client';

import { useState } from 'react';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function ProductCard({ product, onAddToCart, onToggleFavourite, isFavourite }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    await onAddToCart?.(product, quantity);
    setLoading(false);
    setQuantity(1);
  };

  const handleToggleFavourite = async () => {
    setLoading(true);
    await onToggleFavourite?.(product.id);
    setLoading(false);
  };

  const imageUrl = product.images?.[0] || '/placeholder-product.png';
  const inStock = product.stock > 0;
  const lowStock = product.stock <= product.low_stock_threshold;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-product.png';
          }}
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
        {lowStock && inStock && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            Low Stock
          </div>
        )}
        <button
          onClick={handleToggleFavourite}
          disabled={loading}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
        >
          <svg
            className={`w-5 h-5 ${isFavourite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{product.name}</h3>
          {product.category_name && (
            <span className="text-xs text-gray-500">{product.category_name}</span>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(product.unit_price)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/ {product.unit}</span>
          </div>
          <div className="text-sm text-gray-600">
            Stock: <span className={lowStock ? 'text-orange-500 font-semibold' : ''}>{product.stock}</span>
          </div>
        </div>

        {/* Shop Info */}
        {product.shop && (
          <div className="text-xs text-gray-500 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {product.shop.business_name || product.shop.full_name}
          </div>
        )}

        {/* Add to Cart */}
        {inStock && onAddToCart && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x py-1 focus:outline-none"
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-1 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              {loading ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        )}

        {!inStock && (
          <button disabled className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed text-sm font-medium">
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
}
