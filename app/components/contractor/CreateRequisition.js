'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/app/lib/utils/currency';

// ── PDF ───────────────────────────────────────────────────────────────────────
async function downloadPDF({ selected, shop, notes, total, requiresApproval, requisitionId }) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const m = 15;

  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('MATERIAL REQUISITION FORM', pageW / 2, 18, { align: 'center' });

  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-PG', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Date: ${dateStr}`, m, 26);
  if (requisitionId) doc.text(`Ref #: ${requisitionId.slice(0, 8).toUpperCase()}`, pageW - m, 26, { align: 'right' });
  doc.text(`Hardware Shop: ${shop || '—'}`, m, 32);

  doc.setFont('helvetica', 'bolditalic'); doc.setFontSize(10);
  doc.text('Inventory Material Item(s) Needed For Project', pageW / 2, 40, { align: 'center' });

  const tableRows = selected.map((r, i) => [
    i + 1,
    r.stock_no || '—',
    r.qty,
    r.unit || '—',
    r.name,
    formatCurrency(r.unit_price || 0),
    formatCurrency(r.qty * (r.unit_price || 0)),
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Stock #', 'Qty', 'Unit', 'Item Description', 'Unit Price', 'Total']],
    body: tableRows,
    margin: { left: m, right: m },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 18 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
    },
  });

  let y = doc.lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`Estimated Total: ${formatCurrency(total)}`, pageW - m, y, { align: 'right' });

  if (requiresApproval) {
    y += 6; doc.setTextColor(180, 120, 0); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('* Total exceeds K5,000 — Admin approval required before fulfilment.', m, y);
    doc.setTextColor(0);
  }

  if (notes.trim()) {
    y += 8; doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('Notes / Special Instructions:', m, y);
    y += 5; doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const lines = doc.splitTextToSize(notes, pageW - m * 2);
    doc.text(lines, m, y); y += lines.length * 4;
  }

  y = Math.max(y + 12, 240);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  [[`Requested by:`, m], [`Authorised by:`, pageW / 2 + 5]].forEach(([label, x]) => {
    doc.text(label, x, y);
    doc.line(x, y + 8, x + 75, y + 8);
    doc.text('Signature / Date', x, y + 12);
  });

  doc.setFontSize(7); doc.setTextColor(150);
  doc.text('PNG Requisition System — generated ' + new Date().toISOString(), pageW / 2, 290, { align: 'center' });
  doc.save(`requisition-${requisitionId ? requisitionId.slice(0, 8) : 'draft'}.pdf`);
}

// ── Qty stepper ───────────────────────────────────────────────────────────────
function QtyStepper({ value, onChange, small }) {
  const n = Number(value) || 0;
  const btn = small
    ? 'w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm font-bold'
    : 'w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 text-sm font-bold';
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(0, n - 1))} className={btn}>−</button>
      <input
        type="number" min="0" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`${small ? 'w-10' : 'w-12'} text-center border border-gray-300 rounded text-sm px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500`}
      />
      <button type="button" onClick={() => onChange(n + 1)} className={btn}>+</button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CreateRequisition() {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');
  // selected: { [product_id]: { ...product, qty } }
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/shops').then(r => r.json()).then(d => setShops(d.shops || []));
  }, []);

  useEffect(() => {
    if (!selectedShop) { setProducts([]); setSelected({}); return; }
    setLoadingProducts(true);
    fetch(`/api/products?shop_id=${selectedShop.id}&limit=200`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .finally(() => setLoadingProducts(false));
    setSelected({});
    setSearch('');
  }, [selectedShop]);

  const addItem = (p) => {
    setSelected(prev => ({
      ...prev,
      [p.id]: prev[p.id] ? prev[p.id] : { ...p, qty: 1 },
    }));
  };

  const setQty = (id, qty) => {
    if (qty <= 0) {
      setSelected(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else {
      setSelected(prev => ({ ...prev, [id]: { ...prev[id], qty } }));
    }
  };

  const removeItem = (id) => setSelected(prev => { const n = { ...prev }; delete n[id]; return n; });

  const selectedList = Object.values(selected);
  const total = selectedList.reduce((s, i) => s + i.qty * (i.unit_price || 0), 0);
  const requiresApproval = total > 5000;

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const buildItems = () => selectedList.map(r => ({
    product_id: r.id,
    product_name: r.name,
    quantity: r.qty,
    unit_price: Number(r.unit_price) || 0,
    total: r.qty * (Number(r.unit_price) || 0),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShop) { alert('Please select a hardware shop.'); return; }
    if (selectedList.length === 0) { alert('Select at least one material.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: buildItems(),
          notes,
          assigned_shop_id: selectedShop.id,
          assigned_shop_name: selectedShop.business_name || selectedShop.full_name || 'Selected Shop',
        }),
      });
      const data = await res.json();
      if (res.ok) router.push('/requisitions');
      else alert(data.error || 'Failed to submit requisition.');
    } catch { alert('An error occurred. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const shopName = selectedShop ? (selectedShop.business_name || selectedShop.full_name) : '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Material Requisition</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the form below to request inventory materials.</p>
        </div>
        <button
          type="button"
          onClick={() => downloadPDF({ selected: selectedList, shop: shopName, notes, total, requiresApproval, requisitionId: null })}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17a9 9 0 0118 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1z" />
          </svg>
          Download PDF
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Shop selector ── */}
        <div className="bg-white border border-gray-300 rounded p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Hardware Shop <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedShop?.id || ''}
            onChange={e => setSelectedShop(shops.find(s => s.id === e.target.value) || null)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">— Select a hardware shop —</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>
                {s.business_name || s.full_name}{s.city ? ` · ${s.city}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* ── Product catalogue ── */}
        {selectedShop && (
          <div className="bg-white border border-gray-300 rounded">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                {shopName} — Available Materials
                {loadingProducts && <span className="ml-2 text-gray-400 font-normal normal-case">Loading…</span>}
              </h2>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search materials…"
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {!loadingProducts && filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No materials found for this shop.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0">
              {filtered.map((p, i) => {
                const isAdded = !!selected[p.id];
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${isAdded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.unit || 'ea'} · {formatCurrency(p.unit_price || 0)}</p>
                    </div>
                    {isAdded ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <QtyStepper small value={selected[p.id].qty} onChange={v => setQty(p.id, v)} />
                        <button type="button" onClick={() => removeItem(p.id)} className="ml-1 text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addItem(p)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 text-lg leading-none"
                      >+</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Requisition table (paper form) ── */}
        {selectedList.length > 0 && (
          <div className="bg-white border-2 border-black overflow-x-auto">
            <div className="border-b-2 border-black px-4 py-2 text-center">
              <span className="text-sm font-bold italic uppercase tracking-wide">
                Inventory Material Item(s) Needed For Project
              </span>
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-white">
                  <th className="border-r border-black px-2 py-2 text-left font-bold uppercase text-xs w-8">#</th>
                  <th className="border-r border-black px-2 py-2 text-left font-bold uppercase text-xs w-24">Stock #</th>
                  <th className="border-r border-black px-2 py-2 text-center font-bold uppercase text-xs w-36">Qty.</th>
                  <th className="border-r border-black px-2 py-2 text-left font-bold uppercase text-xs w-24">Unit</th>
                  <th className="border-r border-black px-2 py-2 text-left font-bold uppercase text-xs">Item Description</th>
                  <th className="border-r border-black px-2 py-2 text-right font-bold uppercase text-xs w-28">Unit Price</th>
                  <th className="px-2 py-2 text-right font-bold uppercase text-xs w-28">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedList.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                    <td className="border-r border-gray-300 border-b border-gray-200 px-2 py-1 text-xs text-gray-400">{i + 1}</td>
                    <td className="border-r border-gray-300 border-b border-gray-200 px-2 py-1 text-xs text-gray-500">
                      {row.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="border-r border-gray-300 border-b border-gray-200 px-2 py-1">
                      <QtyStepper small value={row.qty} onChange={v => setQty(row.id, v)} />
                    </td>
                    <td className="border-r border-gray-300 border-b border-gray-200 px-2 py-1 text-xs">{row.unit || 'ea'}</td>
                    <td className="border-r border-gray-300 border-b border-gray-200 px-2 py-1 text-xs font-medium">{row.name}</td>
                    <td className="border-r border-gray-300 border-b border-gray-200 px-2 py-1 text-xs text-right text-gray-500">
                      {formatCurrency(row.unit_price || 0)}
                    </td>
                    <td className="border-b border-gray-200 px-2 py-1 text-xs text-right font-semibold">
                      {formatCurrency(row.qty * (row.unit_price || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black bg-white">
                  <td colSpan={5} />
                  <td className="px-2 py-2 text-xs font-bold uppercase text-right border-r border-black">Total</td>
                  <td className="px-2 py-2 text-sm font-bold text-right">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
            {requiresApproval && (
              <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 text-xs text-yellow-800">
                ⚠️ Total exceeds K5,000 — admin approval required before fulfilment.
              </div>
            )}
          </div>
        )}

        {/* ── Notes + Summary ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Notes / Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Delivery instructions, urgency, project name…"
            />
          </div>

          <div className="bg-white border border-gray-300 rounded p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items selected</span>
              <span className="font-semibold">{selectedList.length}</span>
            </div>
            {selectedList.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Total</span>
                <span className="font-bold text-blue-700 text-lg">{formatCurrency(total)}</span>
              </div>
            )}
            <div className="pt-3 border-t flex justify-between text-xs text-gray-500">
              <span>Shop</span>
              <span className="font-medium text-gray-700 text-right max-w-[60%] truncate">
                {shopName || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2 bg-red-600 text-white rounded text-sm font-bold uppercase tracking-wide hover:bg-red-700 disabled:bg-gray-400"
          >
            {submitting ? 'Submitting…' : 'Submit Requisition'}
          </button>
        </div>

      </form>
    </div>
  );
}
