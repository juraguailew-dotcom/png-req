'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';
import { currency } from '@/app/lib/utils/currency';
import { useProductImages } from '@/app/lib/utils/useProductImages';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const { imageUrls, uploadError, uploadingImages, handleImageChange, removeImage, setUrls } = useProductImages();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    unit: 'unit',
    unitPrice: '',
    stock: '',
    lowStockThreshold: '10',
    pricingMethod: 'unit',
    active: true,
  });

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await Promise.all([fetchProduct(), fetchCategories()]);
    };
    init();
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/shop/products/${productId}`);
      const data = await res.json();

      if (data.product) {
        setFormData({
          name: data.product.name,
          description: data.product.description || '',
          categoryId: data.product.category_id || '',
          unit: data.product.unit || 'unit',
          unitPrice: data.product.unit_price,
          stock: data.product.stock,
          lowStockThreshold: data.product.low_stock_threshold,
          pricingMethod: data.product.pricing_method || 'unit',
          active: data.product.active !== false,
        });
        setUrls(data.product.images || []);
      }
    } catch (_) {
      setErrors({ submit: 'Failed to load product' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (_) {
      // silently handle
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Price must be greater than 0';
    }

    if (formData.stock === '' || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }

    if (parseInt(formData.lowStockThreshold) < 0) {
      newErrors.lowStockThreshold = 'Low stock threshold must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/shop/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: formData.categoryId,
          unit: formData.unit,
          unit_price: parseFloat(formData.unitPrice),
          stock: parseInt(formData.stock),
          low_stock_threshold: parseInt(formData.lowStockThreshold),
          pricing_method: formData.pricingMethod,
          active: formData.active,
          images: imageUrls,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Product updated successfully.');
        setTimeout(() => router.push('/shop/inventory'), 1200);
      } else {
        setErrors({ submit: data.error || 'Failed to update product' });
      }
    } catch (_) {
      setErrors({ submit: 'An error occurred while updating the product' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  if (!user || loading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <a href="/shop/inventory" className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Inventory
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-1">Update product details and inventory</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {errors.submit && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Copper Wire 2.5mm"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product details, specifications, etc."
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Images (up to 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={uploadingImages || imageUrls.length >= 5}
                className="w-full text-sm text-gray-700 file:border file:border-gray-300 file:rounded-lg file:px-3 file:py-2 file:bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Upload up to 5 product images. Recommended formats: JPG, PNG.</p>
              {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
              {imageUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {imageUrls.map((url, index) => (
                    <div key={url} className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt={`Product image ${index + 1}`} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 rounded-full bg-white p-1 text-gray-700 shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category and Unit Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="unit">Unit</option>
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="meter">Meter</option>
                  <option value="liter">Liter</option>
                  <option value="dozen">Dozen</option>
                  <option value="bundle">Bundle</option>
                  <option value="box">Box</option>
                  <option value="roll">Roll</option>
                  <option value="sheet">Sheet</option>
                </select>
              </div>
            </div>

            {/* Price and Stock Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit Price ({currency.symbol}) *
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.unitPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.unitPrice && <p className="text-red-600 text-sm mt-1">{errors.unitPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  placeholder="10"
                  min="0"
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.lowStockThreshold ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lowStockThreshold && <p className="text-red-600 text-sm mt-1">{errors.lowStockThreshold}</p>}
              </div>
            </div>

            {/* Pricing Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pricing Method
              </label>
              <select
                name="pricingMethod"
                value={formData.pricingMethod}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="unit">Unit Price</option>
                <option value="bulk">Bulk Pricing</option>
                <option value="category">Category Based</option>
              </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="w-4 h-4 border border-gray-300 rounded accent-blue-600"
              />
              <label className="text-sm font-semibold text-gray-700">
                Product is active and available for purchase
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <a
                href="/shop/inventory"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={saving || uploadingImages}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
