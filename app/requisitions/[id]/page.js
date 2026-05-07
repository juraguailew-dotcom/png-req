'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import Header from '@/app/components/shared/Header';
import { formatCurrency } from '@/app/lib/utils/currency';

export default function RequisitionDetailPage() {
  const [user, setUser] = useState(null);
  const [requisition, setRequisition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
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
      fetchRequisition();
    };
    init();
  }, [router, params.id]);

  const fetchRequisition = async () => {
    try {
      const res = await fetch(`/api/requisitions/${params.id}`);
      const data = await res.json();
      setRequisition(data.requisition);
    } catch (error) {
      console.error('Error fetching requisition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this requisition?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/requisitions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (res.ok) {
        alert('Requisition cancelled successfully');
        fetchRequisition();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel requisition');
      }
    } catch (error) {
      console.error('Error cancelling requisition:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requisition_id: requisition.id,
          reviewee_id: requisition.assigned_shop_id,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        setRating(5);
        setComment('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      fulfilled: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Requisition not found</h2>
            <a href="/requisitions" className="text-blue-600 hover:text-blue-800">
              Back to requisitions
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a href="/requisitions" className="text-blue-600 hover:text-blue-800 flex items-center mb-4">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Requisitions
          </a>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Requisition #{requisition.id.slice(0, 8)}</h1>
              <p className="text-gray-600 mt-1">Created on {new Date(requisition.created_at).toLocaleString()}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded-full border capitalize ${getStatusColor(requisition.status)}`}>
              {requisition.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {requisition.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-4 last:border-b-0 last:pb-0">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(requisition.total_amount)}</span>
                  </div>
                  {requisition.requires_approval && (
                    <p className="text-sm text-yellow-600 mt-2">⚠️ This requisition requires admin approval</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {requisition.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700">{requisition.notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Requisition Created</p>
                    <p className="text-sm text-gray-600">{new Date(requisition.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {requisition.approved_at && (
                  <div className="flex">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Approved</p>
                      <p className="text-sm text-gray-600">{new Date(requisition.approved_at).toLocaleString()}</p>
                      {requisition.approval_comment && (
                        <p className="text-sm text-gray-600 mt-1">Comment: {requisition.approval_comment}</p>
                      )}
                    </div>
                  </div>
                )}

                {requisition.fulfilled_at && (
                  <div className="flex">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full"></div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Fulfilled</p>
                      <p className="text-sm text-gray-600">{new Date(requisition.fulfilled_at).toLocaleString()}</p>
                      {requisition.fulfillment_notes && (
                        <p className="text-sm text-gray-600 mt-1">Notes: {requisition.fulfillment_notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shop Info */}
            {requisition.shop && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Shop</h2>
                <div>
                  <p className="font-medium text-gray-900">{requisition.shop.business_name || requisition.shop.full_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{requisition.shop.email}</p>
                  {requisition.shop.phone && (
                    <p className="text-sm text-gray-600">{requisition.shop.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {requisition.status === 'pending' && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
                  >
                    Cancel Requisition
                  </button>
                )}

                {requisition.status === 'fulfilled' && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Leave a Review
                  </button>
                )}

                <a
                  href={`/messages?with=${requisition.assigned_shop_id}`}
                  className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium text-center"
                >
                  Message Shop
                </a>
              </div>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave a Review</h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-3xl focus:outline-none"
                        >
                          {star <= rating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Share your experience..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                    >
                      {actionLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
