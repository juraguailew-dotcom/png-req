'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function InventoryPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, low, out, active
  const [sortBy, setSortBy] = useState('name'); // name, stock, price, created
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
  });

  // Initialize
  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchInventory();
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shop/products?page=1&limit=1000');
      const data = await res.json();
      
      if (data.products) {
        setProducts(data.products);
        calculateStats(data.products);
      }
      
      // Fetch categories
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.categories) {
        setCategories(catData.categories);
      }
    } catch (_) {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productList) => {
    const lowStock = productList.filter(p => p.stock <= p.low_stock_threshold && p.stock > 0).length;
    const outOfStock = productList.filter(p => p.stock === 0).length;
    const totalValue = productList.reduce((sum, p) => sum + (p.unit_price * p.stock), 0);

    setStats({
      totalProducts: productList.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      totalValue,
    });
  };

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => {
        const catId = typeof p.category === 'object' ? p.category?.id : p.category_id;
        return catId === selectedCategory;
      });
    }

    // Status filter
    if (filterStatus === 'low') {
      filtered = filtered.filter(p => p.stock <= p.low_stock_threshold && p.stock > 0);
    } else if (filterStatus === 'out') {
      filtered = filtered.filter(p => p.stock === 0);
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(p => p.active === true);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stock':
          return a.stock - b.stock;
        case 'price':
          return a.unit_price - b.unit_price;
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterStatus, sortBy, selectedCategory]);

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/shop/products/${deleteTarget}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== deleteTarget));
        setShowDeleteModal(false);
        setDeleteTarget(null);
      } else {
        alert('Failed to delete product');
      }
    } catch (_) {
      alert('Error deleting product');
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const res = await fetch(`/api/shop/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: Math.max(0, newStock) }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProducts(products.map(p => p.id === productId ? updated.product : p));
      }
    } catch (_) {
      // silently handle
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', badge: 'bg-red-500' };
    }
    if (product.stock <= product.low_stock_threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', badge: 'bg-yellow-500' };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', badge: 'bg-green-500' };
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 mt-1">Manage your products and stock levels</p>
            </div>
            <a
              href="/shop/inventory/add"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 0v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Low Stock Items</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.lowStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0zM12 9v4m0 4h.01" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600">{stats.outOfStockCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Inventory Value</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
                      fontSize="11" fontWeight="800" fill="currentColor" fontFamily="Arial, sans-serif">K</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="price">Sort by Price</option>
              <option value="created">Sort by Date Added</option>
            </select>

            <button
              onClick={() => setSearchTerm('')}
              className="border rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Loading inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 0v10l8 4" />
              </svg>
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">
                {searchTerm || selectedCategory ? 'Try adjusting your filters' : 'Add your first product to get started'}
              </p>
              {!searchTerm && !selectedCategory && (
                <a href="/shop/inventory/add" className="text-blue-600 hover:text-blue-800 mt-4 inline-block font-medium">
                  Add Product →
                </a>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map(product => {
                    const status = getStockStatus(product);
                    const itemValue = product.unit_price * product.stock;
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {typeof product.category === 'object' ? product.category?.name : product.category_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={product.stock}
                              onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-3 py-1 border rounded font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                            />
                            <span className="text-xs text-gray-500">({product.unit})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(product.unit_price)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(itemValue)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <a
                              href={`/shop/inventory/${product.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Edit
                            </a>
                            <button
                              onClick={() => {
                                setDeleteTarget(product.id);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Product?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
