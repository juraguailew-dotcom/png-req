'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/app/components/shared/Header';
import { createClient } from '@/app/lib/supabase';
import { formatCurrency } from '@/app/lib/utils/currency';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  quoted: 'bg-purple-100 text-purple-700',
  fulfilled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const GST_RATE = 0.10;

function itemGst(item) {
  return (Number(item.subtotal) || 0) * GST_RATE;
}

function QuotationForm({ requisition, onSuccess, onCancel }) {
  const [items, setItems] = useState(
    (requisition.items || []).map((item) => {
      const qty = item.quantity || 1;
      const price = item.unit_price || item.price || '';
      const subtotal = qty && price ? Number(qty) * Number(price) : '';
      return {
        name: item.product_name || item.name || item.description || '',
        description: item.description || item.product_name || '',
        quantity: qty,
        unit_price: price,
        subtotal,
      };
    })
  );
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const qty = field === 'quantity' ? Number(value) : Number(updated[index].quantity);
      const price = field === 'unit_price' ? Number(value) : Number(updated[index].unit_price);
      updated[index].subtotal = qty && price ? qty * price : '';
      return updated;
    });
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const gstAmount = subtotal * GST_RATE;
  const totalAmount = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!subtotal) return setError('Please enter prices for all items');
    setSubmitting(true);
    const payload = {
      items: items.map((item) => ({
        ...item,
        gst: itemGst(item),
        total: (Number(item.subtotal) || 0) + itemGst(item),
      })),
      subtotal,
      gst_amount: gstAmount,
      gst_rate: GST_RATE,
      total_amount: totalAmount,
      notes,
      valid_until: validUntil || null,
    };
    try {
      const res = await fetch(`/api/shop/requisitions/${requisition.id}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit quotation');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3">Submit Quotation</h4>

      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left pb-2">Item / Description</th>
              <th className="text-left pb-2 w-20">Qty</th>
              <th className="text-left pb-2 w-32">Unit Price (K)</th>
              <th className="text-right pb-2 w-28">Subtotal (K)</th>
              <th className="text-right pb-2 w-24">GST 10%</th>
              <th className="text-right pb-2 w-28">Total incl. GST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => {
              const gst = itemGst(item);
              const lineTotal = (Number(item.subtotal) || 0) + gst;
              return (
                <tr key={idx}>
                  <td className="py-2 pr-2">
                    <div className="text-xs text-gray-500 mb-1 italic">{item.name}</div>
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
                      placeholder="Add description (optional)"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      required
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      required
                    />
                  </td>
                  <td className="py-2 text-right text-gray-600">
                    {item.subtotal ? formatCurrency(item.subtotal) : '—'}
                  </td>
                  <td className="py-2 text-right text-orange-600">
                    {item.subtotal ? formatCurrency(gst) : '—'}
                  </td>
                  <td className="py-2 text-right text-gray-800 font-medium">
                    {lineTotal ? formatCurrency(lineTotal) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GST Breakdown */}
      <div className="border-t border-gray-200 pt-3 mb-3 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal (excl. GST)</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-orange-600">
          <span>GST (10% — PNG IRC)</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>
        <div className="flex justify-between text-gray-900 font-bold text-base border-t border-gray-300 pt-2 mt-1">
          <span>Total (incl. GST)</span>
          <span className="text-green-700">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Delivery time, payment terms, etc."
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Valid Until (optional)</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send Quotation'}
        </button>
      </div>
    </form>
  );
}

function RequisitionRow({ requisition, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-white cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-semibold text-gray-900 shrink-0">#{requisition.id.slice(0, 8)}</span>
          <span className="text-sm text-gray-600 truncate">
            {requisition.contractor?.full_name || requisition.contractor_name || 'Unknown'}
          </span>
          <span className="text-sm text-gray-500 hidden sm:block">
            {requisition.items?.length || 0} items
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-medium text-gray-900">{formatCurrency(requisition.total_amount)}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[requisition.status] || 'bg-gray-100 text-gray-600'}`}>
            {requisition.status}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 bg-white border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Contractor</p>
              <p className="text-gray-800">{requisition.contractor?.full_name || requisition.contractor_name}</p>
              {requisition.contractor?.email && (
                <p className="text-gray-500">{requisition.contractor.email}</p>
              )}
              {requisition.contractor?.phone && (
                <p className="text-gray-500">{requisition.contractor.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Placed</p>
              <p className="text-gray-800">{new Date(requisition.created_at).toLocaleDateString()}</p>
              {requisition.notes && (
                <>
                  <p className="text-xs text-gray-500 uppercase font-medium mt-2 mb-1">Notes</p>
                  <p className="text-gray-700">{requisition.notes}</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs text-gray-500 uppercase font-medium mb-2">Requested Items</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left pb-1">Item / Description</th>
                    <th className="text-left pb-1 w-20">Qty</th>
                    <th className="text-left pb-1 w-28">Unit Price</th>
                    <th className="text-left pb-1 w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(requisition.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5">
                        <span className="text-gray-800 font-medium">{item.product_name || item.name || item.description || '—'}</span>
                        {item.description && (item.name || item.product_name) && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="py-1.5 text-gray-600">{item.quantity}</td>
                      <td className="py-1.5 text-gray-600">{item.unit_price ? formatCurrency(item.unit_price) : '—'}</td>
                      <td className="py-1.5 text-gray-800 font-medium">{item.total ? formatCurrency(item.total) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {requisition.quotation && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              <p className="font-semibold text-purple-800 mb-2">Quotation Sent</p>
              <div className="space-y-0.5">
                {requisition.quotation.subtotal != null && (
                  <div className="flex justify-between text-purple-700">
                    <span>Subtotal (excl. GST)</span>
                    <span>{formatCurrency(requisition.quotation.subtotal)}</span>
                  </div>
                )}
                {requisition.quotation.gst_amount != null && (
                  <div className="flex justify-between text-orange-600">
                    <span>GST (10% — PNG IRC)</span>
                    <span>{formatCurrency(requisition.quotation.gst_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-purple-900 border-t border-purple-200 pt-1 mt-1">
                  <span>Total (incl. GST)</span>
                  <span>{formatCurrency(requisition.quotation.total_amount)}</span>
                </div>
              </div>
              {requisition.quotation.notes && <p className="text-purple-600 mt-2">{requisition.quotation.notes}</p>}
              {requisition.quotation.valid_until && (
                <p className="text-purple-500 text-xs mt-1">Valid until: {new Date(requisition.quotation.valid_until).toLocaleDateString()}</p>
              )}
            </div>
          )}

          {!showForm && requisition.status !== 'fulfilled' && requisition.status !== 'cancelled' && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                {requisition.quotation ? 'Revise Quotation' : 'Send Quotation'}
              </button>
            </div>
          )}

          {showForm && (
            <QuotationForm
              requisition={requisition}
              onSuccess={() => { setShowForm(false); onRefresh(); }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ShopRequisitionsPage() {
  const [user, setUser] = useState(null);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/shop/requisitions${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setRequisitions(data.requisitions || []);
    } catch (_) {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    if (user) fetchRequisitions();
  }, [user, fetchRequisitions]);

  if (!user) return null;

  const STATUSES = ['', 'pending', 'approved', 'quoted', 'fulfilled', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contractor Requisitions</h1>
            <p className="text-gray-500 text-sm mt-1">View requests and send quotations to contractors</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Loading requisitions...</div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700">No requisitions found.</p>
            <p className="text-sm text-gray-500 mt-1">Requisitions assigned to your shop will appear here.</p>
          </div>
        ) : (
          <div>
            {requisitions.map((req) => (
              <RequisitionRow key={req.id} requisition={req} onRefresh={fetchRequisitions} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
